import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * SQLite version - uses text for enums and integers for timestamps
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  subscriptionTier: text("subscriptionTier", { enum: ["none", "trial", "monthly", "yearly"] }).default("none").notNull(),
  subscriptionStatus: text("subscriptionStatus", { enum: ["inactive", "active", "expired", "cancelled"] }).default("inactive").notNull(),
  subscriptionStartDate: integer("subscriptionStartDate", { mode: "timestamp" }),
  subscriptionEndDate: integer("subscriptionEndDate", { mode: "timestamp" }),
  screeningsRemaining: integer("screeningsRemaining").default(0),
  whitelistStatus: text("whitelistStatus", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Vision Screening Sessions
 */
export const visionScreeningSessions = sqliteTable("vision_screening_sessions", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  sessionDate: integer("sessionDate", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  ageGroup: text("ageGroup", { enum: ["0-2", "3-5", "6-12", "13-18", "18+"] }).notNull(),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type VisionScreeningSession = typeof visionScreeningSessions.$inferSelect;
export type InsertVisionScreeningSession = typeof visionScreeningSessions.$inferInsert;

/**
 * Photoscreening Results
 */
export const photoscreeningResults = sqliteTable("photoscreening_results", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId").notNull(),
  redReflexLeft: text("redReflexLeft", { enum: ["normal", "abnormal", "unclear"] }).notNull(),
  redReflexRight: text("redReflexRight", { enum: ["normal", "abnormal", "unclear"] }).notNull(),
  eyeAlignment: text("eyeAlignment").notNull(),
  pupilSymmetry: text("pupilSymmetry", { enum: ["symmetric", "asymmetric"] }).notNull(),
  confidence: integer("confidence").notNull(),
  imageUrl: text("imageUrl"),
  assessment: text("assessment", { enum: ["pass", "refer", "inconclusive"] }).notNull(),
  concerns: text("concerns"), // JSON array
  recommendations: text("recommendations"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type PhotoscreeningResult = typeof photoscreeningResults.$inferSelect;
export type InsertPhotoscreeningResult = typeof photoscreeningResults.$inferInsert;

/**
 * Visual Acuity Results
 */
export const visualAcuityResults = sqliteTable("visual_acuity_results", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId").notNull(),
  eyeTested: text("eyeTested", { enum: ["left", "right", "both"] }).notNull(),
  acuityMeasurement: text("acuityMeasurement").notNull(),
  acuityDecimal: real("acuityDecimal"),
  testMethod: text("testMethod", { enum: ["snellen", "tumbling_e", "lea_symbols", "picture_matching"] }).notNull(),
  distanceMeters: real("distanceMeters").notNull(),
  percentCorrect: integer("percentCorrect"),
  assessment: text("assessment", { enum: ["pass", "refer", "inconclusive"] }).notNull(),
  severity: text("severity", { enum: ["normal", "mild", "moderate", "severe"] }),
  recommendations: text("recommendations"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type VisualAcuityResult = typeof visualAcuityResults.$inferSelect;
export type InsertVisualAcuityResult = typeof visualAcuityResults.$inferInsert;

/**
 * Hearing Screening Sessions
 */
export const hearingScreeningSessions = sqliteTable("hearing_screening_sessions", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  sessionDate: integer("sessionDate", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  ageGroup: text("ageGroup", { enum: ["0-2", "3-5", "6-12", "13-18", "18+"] }).notNull(),
  calibrated: integer("calibrated", { mode: "boolean" }).default(false),
  calibrationData: text("calibrationData"), // JSON
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type HearingScreeningSession = typeof hearingScreeningSessions.$inferSelect;
export type InsertHearingScreeningSession = typeof hearingScreeningSessions.$inferInsert;

/**
 * Pure Tone Audiometry Results
 */
export const pureToneAudiometryResults = sqliteTable("pure_tone_audiometry_results", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId").notNull(),
  earTested: text("earTested", { enum: ["left", "right"] }).notNull(),
  frequency: integer("frequency").notNull(),
  thresholdDbHL: integer("thresholdDbHL").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type PureToneAudiometryResult = typeof pureToneAudiometryResults.$inferSelect;
export type InsertPureToneAudiometryResult = typeof pureToneAudiometryResults.$inferInsert;

/**
 * Hearing Assessment Summary
 */
export const hearingAssessments = sqliteTable("hearing_assessments", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId").notNull(),
  earTested: text("earTested", { enum: ["left", "right", "both"] }).notNull(),
  ptaAverage: real("ptaAverage"),
  hfaAverage: real("hfaAverage"),
  classification: text("classification", { enum: ["normal", "slight", "mild", "moderate", "moderately_severe", "severe", "profound"] }),
  audiogramPattern: text("audiogramPattern", { enum: ["flat", "sloping", "rising", "notched", "cookie_bite", "irregular"] }),
  assessment: text("assessment", { enum: ["pass", "refer", "inconclusive"] }).notNull(),
  recommendations: text("recommendations"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type HearingAssessment = typeof hearingAssessments.$inferSelect;
export type InsertHearingAssessment = typeof hearingAssessments.$inferInsert;

/**
 * Speech-in-Noise Results
 */
export const speechInNoiseResults = sqliteTable("speech_in_noise_results", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId").notNull(),
  snrLevel: integer("snrLevel").notNull(),
  percentCorrect: integer("percentCorrect").notNull(),
  wordsPresented: integer("wordsPresented").notNull(),
  wordsCorrect: integer("wordsCorrect").notNull(),
  assessment: text("assessment", { enum: ["excellent", "good", "fair", "poor", "very_poor"] }).notNull(),
  recommendations: text("recommendations"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type SpeechInNoiseResult = typeof speechInNoiseResults.$inferSelect;
export type InsertSpeechInNoiseResult = typeof speechInNoiseResults.$inferInsert;

/**
 * Access Requests
 */
export const accessRequests = sqliteTable("access_requests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  organization: text("organization"),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  reviewedBy: text("reviewedBy"),
  reviewedAt: integer("reviewedAt", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = typeof accessRequests.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  visionSessions: many(visionScreeningSessions),
  hearingSessions: many(hearingScreeningSessions),
}));

export const visionSessionsRelations = relations(visionScreeningSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [visionScreeningSessions.userId],
    references: [users.id],
  }),
  photoscreeningResults: many(photoscreeningResults),
  visualAcuityResults: many(visualAcuityResults),
}));

export const photoscreeningResultsRelations = relations(photoscreeningResults, ({ one }) => ({
  session: one(visionScreeningSessions, {
    fields: [photoscreeningResults.sessionId],
    references: [visionScreeningSessions.id],
  }),
}));

export const visualAcuityResultsRelations = relations(visualAcuityResults, ({ one }) => ({
  session: one(visionScreeningSessions, {
    fields: [visualAcuityResults.sessionId],
    references: [visionScreeningSessions.id],
  }),
}));

export const hearingSessionsRelations = relations(hearingScreeningSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [hearingScreeningSessions.userId],
    references: [users.id],
  }),
  pureToneResults: many(pureToneAudiometryResults),
  assessments: many(hearingAssessments),
  speechInNoiseResults: many(speechInNoiseResults),
}));

export const pureToneResultsRelations = relations(pureToneAudiometryResults, ({ one }) => ({
  session: one(hearingScreeningSessions, {
    fields: [pureToneAudiometryResults.sessionId],
    references: [hearingScreeningSessions.id],
  }),
}));

export const hearingAssessmentsRelations = relations(hearingAssessments, ({ one }) => ({
  session: one(hearingScreeningSessions, {
    fields: [hearingAssessments.sessionId],
    references: [hearingScreeningSessions.id],
  }),
}));

export const speechInNoiseResultsRelations = relations(speechInNoiseResults, ({ one }) => ({
  session: one(hearingScreeningSessions, {
    fields: [speechInNoiseResults.sessionId],
    references: [hearingScreeningSessions.id],
  }),
}));
