import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, operatorProcedure, adminProcedure } from "../trpc";
import { enqueueRetry } from "@wowcut/queues";

export const operatorQcRouter = router({
  queue: operatorProcedure
    .input(
      z
        .object({
          includePassed: z.boolean().default(false),
          clientId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const units = await ctx.prisma.contentPlanItem.findMany({
        where: {
          status: input?.includePassed ? { in: ["needs_review", "ready"] } : "needs_review",
          ...(input?.clientId ? { clientId: input.clientId } : {}),
        },
        include: {
          client: { select: { id: true, name: true, slug: true, plan: true } },
          sku: true,
          generations: { orderBy: { alternateIndex: "asc" } },
        },
        orderBy: { updatedAt: "asc" },
        take: 60,
      });
      return units;
    }),

  bulkApprove: operatorProcedure
    .input(z.array(z.object({ unitId: z.string(), generationId: z.string() })))
    .mutation(async ({ ctx, input }) => {
      for (const entry of input) {
        await ctx.prisma.contentPlanItem.update({
          where: { id: entry.unitId },
          data: { chosenGenerationId: entry.generationId, status: "ready" },
        });
        await ctx.prisma.auditLog.create({
          data: {
            actor: ctx.session.actorId ?? "operator",
            action: "qc_approve",
            entity: `unit:${entry.unitId}`,
            metadata: { generationId: entry.generationId },
          },
        });
      }
      return { approved: input.length };
    }),

  bulkRetry: operatorProcedure
    .input(z.array(z.object({ unitId: z.string(), reason: z.string().optional() })))
    .mutation(async ({ ctx, input }) => {
      for (const entry of input) {
        await ctx.prisma.contentPlanItem.update({
          where: { id: entry.unitId },
          data: {
            status: "generating",
            operatorNotes: entry.reason,
          },
        });
        await ctx.prisma.auditLog.create({
          data: {
            actor: ctx.session.actorId ?? "operator",
            action: "qc_retry",
            entity: `unit:${entry.unitId}`,
            metadata: { reason: entry.reason },
          },
        });
        await enqueueRetry(entry.unitId);
      }
      return { retried: input.length };
    }),

  confidenceQueue: operatorProcedure.query(async ({ ctx }) => {
    return ctx.prisma.generation.findMany({
      where: { sampledForConfidence: true, confidenceVerdict: null },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { unit: { include: { sku: true, client: true } } },
    });
  }),

  submitConfidenceVerdict: operatorProcedure
    .input(z.object({ generationId: z.string(), verdict: z.enum(["approve", "reject"]) }))
    .mutation(async ({ ctx, input }) => {
      const gen = await ctx.prisma.generation.findUnique({ where: { id: input.generationId } });
      if (!gen) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.generation.update({
        where: { id: gen.id },
        data: {
          confidenceVerdict: input.verdict,
          confidenceReviewedAt: new Date(),
        },
      });
      await ctx.prisma.auditLog.create({
        data: {
          actor: ctx.session.actorId ?? "operator",
          action: "qc_confidence_review",
          entity: `generation:${gen.id}`,
          metadata: { verdict: input.verdict },
        },
      });
      return { ok: true };
    }),

  fpRate: operatorProcedure.query(async ({ ctx }) => {
    const reviewed = await ctx.prisma.generation.findMany({
      where: { sampledForConfidence: true, confidenceVerdict: { not: null } },
      select: { confidenceVerdict: true },
    });
    const total = reviewed.length;
    const rejected = reviewed.filter((g) => g.confidenceVerdict === "reject").length;
    return {
      total,
      rejected,
      fpRate: total > 0 ? rejected / total : 0,
    };
  }),

  // Calibration
  calibrationProposals: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.qcCalibrationRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  applyCalibration: adminProcedure
    .input(z.object({ runId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const run = await ctx.prisma.qcCalibrationRun.findUnique({ where: { id: input.runId } });
      if (!run) throw new TRPCError({ code: "NOT_FOUND" });
      if (run.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already applied" });
      }
      await ctx.prisma.qcStyleProfile.update({
        where: { stylePreset: run.stylePreset },
        data: { compositeAutoApprove: run.proposedThreshold },
      });
      await ctx.prisma.qcCalibrationRun.update({
        where: { id: run.id },
        data: {
          status: "applied",
          appliedAt: new Date(),
          appliedBy: ctx.session.actorId ?? "admin",
        },
      });
      return { ok: true };
    }),

  profiles: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.qcStyleProfile.findMany();
  }),

  updateProfile: adminProcedure
    .input(
      z.object({
        stylePreset: z.string(),
        compositeAutoApprove: z.number().optional(),
        compositePass: z.number().optional(),
        productIdentityMin: z.number().optional(),
        promptFidelityMin: z.number().optional(),
        aestheticMin: z.number().optional(),
        brandColorDeltaMax: z.number().optional(),
        compositionMin: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { stylePreset, ...data } = input;
      await ctx.prisma.qcStyleProfile.update({
        where: { stylePreset },
        data,
      });
      return { ok: true };
    }),
});
