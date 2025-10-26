import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  InsertUser,
  users,
  visionScreeningSessions,
  InsertVisionScreeningSession,
  photoscreeningResults,
  InsertPhotoscreeningResult,
  visualAcuityResults,
  InsertVisualAcuityResult,
  hearingScreeningSessions,
  InsertHearingScreeningSession,
  pureToneAudiometryResults,
  InsertPureToneAudiometryResult,
  speechInNoiseResults,
  InsertSpeechInNoiseResult,
  accessRequests,
  InsertAccessRequest,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    try {
      const dbUrl = process.env.DATABASE_URL || "file:./local.db";
      const authToken = process.env.TURSO_AUTH_TOKEN;
      
      const client = createClient({
        url: dbUrl,
        authToken: authToken,
      });
      
      _db = drizzle(client);
      console.log("[Database] Connected to Turso:", dbUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // SQLite upsert syntax
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.id,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.


// Vision Screening Functions
export async function createVisionScreeningSession(
  session: InsertVisionScreeningSession
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(visionScreeningSessions).values(session);
  return session.id;
}

export async function addPhotoscreeningResult(
  result: InsertPhotoscreeningResult
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(photoscreeningResults).values(result);
}

export async function addVisualAcuityResult(
  result: InsertVisualAcuityResult
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(visualAcuityResults).values(result);
}

// Hearing Screening Functions
export async function createHearingScreeningSession(
  session: InsertHearingScreeningSession
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(hearingScreeningSessions).values(session);
  return session.id;
}

export async function addPureToneAudiometryResult(
  result: InsertPureToneAudiometryResult
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(pureToneAudiometryResults).values(result);
}

export async function addSpeechInNoiseResult(
  result: InsertSpeechInNoiseResult
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(speechInNoiseResults).values(result);
}

// Summary Report Functions - Removed (table not in SQLite schema)
// export async function createScreeningSummaryReport(...) { ... }

export async function getUserScreeningHistory(userId: string) {
  const db = await getDb();
  if (!db) return { visionSessions: [], hearingSessions: [] };
  
  const visionSessions = await db
    .select()
    .from(visionScreeningSessions)
    .where(eq(visionScreeningSessions.userId, userId));
  
  const hearingSessions = await db
    .select()
    .from(hearingScreeningSessions)
    .where(eq(hearingScreeningSessions.userId, userId));
  
  return { visionSessions, hearingSessions };
}

export async function getVisionSessionDetails(sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const session = await db
    .select()
    .from(visionScreeningSessions)
    .where(eq(visionScreeningSessions.id, sessionId))
    .limit(1);
  
  if (session.length === 0) return null;
  
  const photoResults = await db
    .select()
    .from(photoscreeningResults)
    .where(eq(photoscreeningResults.sessionId, sessionId));
  
  const acuityResults = await db
    .select()
    .from(visualAcuityResults)
    .where(eq(visualAcuityResults.sessionId, sessionId));
  
  return {
    session: session[0],
    photoscreeningResults: photoResults,
    visualAcuityResults: acuityResults,
  };
}

export async function getHearingSessionDetails(sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const session = await db
    .select()
    .from(hearingScreeningSessions)
    .where(eq(hearingScreeningSessions.id, sessionId))
    .limit(1);
  
  if (session.length === 0) return null;
  
  const pureResults = await db
    .select()
    .from(pureToneAudiometryResults)
    .where(eq(pureToneAudiometryResults.sessionId, sessionId));
  
  const speechResults = await db
    .select()
    .from(speechInNoiseResults)
    .where(eq(speechInNoiseResults.sessionId, sessionId));
  
  return {
    session: session[0],
    pureToneResults: pureResults,
    speechInNoiseResults: speechResults,
  };
}

// Access Request Functions
export async function createAccessRequest(request: InsertAccessRequest): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(accessRequests).values(request);
  return request.id;
}

export async function getAllAccessRequests() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(accessRequests)
    .orderBy(desc(accessRequests.createdAt));
}

export async function updateAccessRequest(
  id: string,
  updates: Partial<InsertAccessRequest>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(accessRequests)
    .set(updates)
    .where(eq(accessRequests.id, id));
}

// Subscription Functions - Removed (table not in SQLite schema)
// Subscription history can be tracked through user table updates
// export async function addSubscriptionHistory(...) { ... }
// export async function getUserSubscriptionHistory(...) { ... }

export async function updateUserSubscription(
  userId: string,
  updates: Partial<InsertUser>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId));
}

// Admin Functions
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function getUserStats() {
  const db = await getDb();
  if (!db) return null;
  
  const allUsers = await db.select().from(users);
  
  return {
    total: allUsers.length,
    active: allUsers.filter(u => u.subscriptionStatus === 'active').length,
    trial: allUsers.filter(u => u.subscriptionTier === 'trial').length,
    paid: allUsers.filter(u => ['monthly', 'yearly'].includes(u.subscriptionTier)).length,
    pending: allUsers.filter(u => u.whitelistStatus === 'pending').length,
  };
}

