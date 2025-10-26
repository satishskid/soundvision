import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { randomUUID } from "crypto";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  screening: router({
    // Vision Screening
    createVisionSession: protectedProcedure
      .input(z.object({
        ageGroup: z.enum(["0-2", "3-5", "6-12", "13-18", "18+"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessionId = randomUUID();
        await db.createVisionScreeningSession({
          id: sessionId,
          userId: ctx.user.id,
          ageGroup: input.ageGroup,
          notes: input.notes,
        });
        return { sessionId };
      }),

    addPhotoscreeningResult: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        eyeSide: z.enum(["left", "right", "both"]),
        redReflexStatus: z.enum(["normal", "abnormal", "unclear"]).optional(),
        eyeAlignment: z.enum(["normal", "esotropia", "exotropia", "unclear"]).optional(),
        refractionEstimate: z.string().optional(),
        imageUrl: z.string().optional(),
        confidence: z.number().int().min(0).max(100).optional(),
      }))
      .mutation(async ({ input }) => {
        const resultId = randomUUID();
        await db.addPhotoscreeningResult({
          id: resultId,
          sessionId: input.sessionId,
          eyeSide: input.eyeSide,
          redReflexStatus: input.redReflexStatus,
          eyeAlignment: input.eyeAlignment,
          refractionEstimate: input.refractionEstimate,
          imageUrl: input.imageUrl,
          confidence: input.confidence,
        });
        return { resultId };
      }),

    addVisualAcuityResult: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        eyeSide: z.enum(["left", "right", "both"]),
        acuityMeasurement: z.string(),
        acuityDecimal: z.number().optional(),
        testMethod: z.enum(["snellen", "tumbling_e", "lea_symbols", "picture_matching"]),
        distanceMeters: z.number(),
        correctionUsed: z.boolean().optional(),
        correctionType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const resultId = randomUUID();
        await db.addVisualAcuityResult({
          id: resultId,
          sessionId: input.sessionId,
          eyeSide: input.eyeSide,
          acuityMeasurement: input.acuityMeasurement,
          acuityDecimal: input.acuityDecimal,
          testMethod: input.testMethod,
          distanceMeters: input.distanceMeters,
          correctionUsed: input.correctionUsed,
          correctionType: input.correctionType,
        });
        return { resultId };
      }),

    // Hearing Screening
    createHearingSession: protectedProcedure
      .input(z.object({
        ageGroup: z.enum(["0-2", "3-5", "6-12", "13-18", "18+"]),
        environmentNoise: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessionId = randomUUID();
        await db.createHearingScreeningSession({
          id: sessionId,
          userId: ctx.user.id,
          ageGroup: input.ageGroup,
          environmentNoise: input.environmentNoise,
          notes: input.notes,
        });
        return { sessionId };
      }),

    addPureToneResult: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        earSide: z.enum(["left", "right"]),
        frequency: z.number().int(),
        threshold: z.number().int(),
        conduction: z.enum(["air", "bone"]),
      }))
      .mutation(async ({ input }) => {
        const resultId = randomUUID();
        await db.addPureToneAudiometryResult({
          id: resultId,
          sessionId: input.sessionId,
          earSide: input.earSide,
          frequency: input.frequency,
          threshold: input.threshold,
          conduction: input.conduction,
        });
        return { resultId };
      }),

    addSpeechInNoiseResult: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        testType: z.enum(["quick_sin", "azbio", "hint", "custom"]),
        signalNoiseRatio: z.number().int().optional(),
        percentCorrect: z.number().min(0).max(100),
        wordsPresented: z.number().int().optional(),
        wordsCorrect: z.number().int().optional(),
        presentationLevel: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        const resultId = randomUUID();
        await db.addSpeechInNoiseResult({
          id: resultId,
          sessionId: input.sessionId,
          testType: input.testType,
          signalNoiseRatio: input.signalNoiseRatio,
          percentCorrect: input.percentCorrect,
          wordsPresented: input.wordsPresented,
          wordsCorrect: input.wordsCorrect,
          presentationLevel: input.presentationLevel,
        });
        return { resultId };
      }),

    // Summary and History
    createSummaryReport: protectedProcedure
      .input(z.object({
        visionSessionId: z.string().optional(),
        hearingSessionId: z.string().optional(),
        overallStatus: z.enum(["pass", "refer", "inconclusive"]),
        visionStatus: z.enum(["pass", "refer", "inconclusive", "not_tested"]).optional(),
        hearingStatus: z.enum(["pass", "refer", "inconclusive", "not_tested"]).optional(),
        visionRecommendations: z.string().optional(),
        hearingRecommendations: z.string().optional(),
        followUpRequired: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const reportId = randomUUID();
        await db.createScreeningSummaryReport({
          id: reportId,
          userId: ctx.user.id,
          visionSessionId: input.visionSessionId,
          hearingSessionId: input.hearingSessionId,
          overallStatus: input.overallStatus,
          visionStatus: input.visionStatus,
          hearingStatus: input.hearingStatus,
          visionRecommendations: input.visionRecommendations,
          hearingRecommendations: input.hearingRecommendations,
          followUpRequired: input.followUpRequired,
        });
        return { reportId };
      }),

    getScreeningHistory: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserScreeningHistory(ctx.user.id);
      }),

    getVisionSessionDetails: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return await db.getVisionSessionDetails(input.sessionId);
      }),

    getHearingSessionDetails: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return await db.getHearingSessionDetails(input.sessionId);
      }),
  }),

  // Access Requests
  accessRequest: router({
    create: publicProcedure
      .input(z.object({
        email: z.string().email(),
        requestedTier: z.enum(["trial", "monthly", "yearly"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const requestId = randomUUID();
        await db.createAccessRequest({
          id: requestId,
          email: input.email,
          requestedTier: input.requestedTier,
          notes: input.notes,
        });
        return { requestId };
      }),

    getAll: protectedProcedure
      .query(async ({ ctx }) => {
        // Only admins can view all requests
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.getAllAccessRequests();
      }),

    approve: protectedProcedure
      .input(z.object({
        requestId: z.string(),
        tier: z.enum(["trial", "monthly", "yearly"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        await db.updateAccessRequest(input.requestId, {
          status: 'approved',
          processedAt: new Date(),
          processedBy: ctx.user.id,
        });
        return { success: true };
      }),

    reject: protectedProcedure
      .input(z.object({
        requestId: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        await db.updateAccessRequest(input.requestId, {
          status: 'rejected',
          processedAt: new Date(),
          processedBy: ctx.user.id,
          notes: input.notes,
        });
        return { success: true };
      }),
  }),

  // Admin
  admin: router({
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.getUserStats();
      }),

    getAllUsers: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.getAllUsers();
      }),

    updateUserSubscription: protectedProcedure
      .input(z.object({
        userId: z.string(),
        subscriptionTier: z.enum(["none", "trial", "monthly", "yearly"]),
        subscriptionStatus: z.enum(["inactive", "active", "expired", "cancelled"]),
        subscriptionStartDate: z.date().optional(),
        subscriptionEndDate: z.date().optional(),
        screeningsRemaining: z.number().int().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        const { userId, ...updates } = input;
        await db.updateUserSubscription(userId, updates);
        
        // Log subscription history
        const historyId = randomUUID();
        await db.addSubscriptionHistory({
          id: historyId,
          userId: userId,
          tier: input.subscriptionTier === 'none' ? 'trial' : input.subscriptionTier,
          action: 'upgraded',
          startDate: input.subscriptionStartDate || new Date(),
          endDate: input.subscriptionEndDate || new Date(),
        });
        
        return { success: true };
      }),

    updateUserWhitelist: protectedProcedure
      .input(z.object({
        userId: z.string(),
        whitelistStatus: z.enum(["pending", "approved", "rejected"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        await db.updateUserSubscription(input.userId, {
          whitelistStatus: input.whitelistStatus,
        });
        return { success: true };
      }),
  }),

  // User Subscription
  subscription: router({
    getHistory: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserSubscriptionHistory(ctx.user.id);
      }),

    getStatus: protectedProcedure
      .query(async ({ ctx }) => {
        const user = await db.getUser(ctx.user.id);
        return {
          tier: user?.subscriptionTier,
          status: user?.subscriptionStatus,
          startDate: user?.subscriptionStartDate,
          endDate: user?.subscriptionEndDate,
          screeningsRemaining: user?.screeningsRemaining,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

