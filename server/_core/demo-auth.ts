/**
 * Demo Authentication System
 * Simple session-based auth for local development
 * Works without OAuth configuration
 */

import { nanoid } from "nanoid";
import type { Request, Response } from "express";
import { upsertUser, getUser } from "../db";

// In-memory session store (for demo purposes)
const sessions = new Map<string, { userId: string; expiresAt: number }>();

/**
 * Create a demo user session
 */
export async function createDemoSession(req: Request, res: Response) {
  try {
    // Create or get demo user
    const userId = "demo-user-" + nanoid(10);
    const user = {
      id: userId,
      name: "Demo User",
      email: "demo@healthscreener.local",
      loginMethod: "demo",
      role: "user" as const,
      lastSignedIn: new Date(),
    };

    // Save user to database
    await upsertUser(user);

    // Create session
    const sessionId = nanoid(32);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    sessions.set(sessionId, { userId, expiresAt });

    // Set cookie
    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error("[Demo Auth] Failed to create session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
}

/**
 * Get user from session
 */
export async function getUserFromSession(sessionId: string | undefined) {
  if (!sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session) return null;

  // Check if expired
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }

  // Get user from database
  return await getUser(session.userId);
}

/**
 * Destroy session
 */
export function destroySession(sessionId: string) {
  sessions.delete(sessionId);
}

/**
 * Clean up expired sessions
 */
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour
