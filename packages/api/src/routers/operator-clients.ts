import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { weekKey, PLAN_LIMITS } from "@wowcut/shared";
import { enqueuePilotMinimum, enqueueWeeklyBatch } from "@wowcut/queues";
import { router, operatorProcedure } from "../trpc";

export const operatorClientsRouter = router({
  list: operatorProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          plan: z.string().optional(),
          minHealth: z.number().int().min(0).max(100).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.client.findMany({
        where: {
          status: input?.status as never,
          plan: input?.plan as never,
          healthScore: input?.minHealth != null ? { gte: input.minHealth } : undefined,
        },
        orderBy: [{ healthScore: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          plan: true,
          status: true,
          healthScore: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });
    }),

  byId: operatorProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const client = await ctx.prisma.client.findUnique({
      where: { id: input.id },
      include: {
        skus: true,
        deliveries: { orderBy: { weekKey: "desc" }, take: 4 },
        briefUpdates: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!client) throw new TRPCError({ code: "NOT_FOUND" });
    return client;
  }),

  updateStatus: operatorProcedure
    .input(z.object({ id: z.string(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.client.update({
        where: { id: input.id },
        data: { status: input.status as never },
      });
      return { ok: true };
    }),

  updateHealthScore: operatorProcedure
    .input(z.object({ id: z.string(), healthScore: z.number().int().min(0).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.client.update({
        where: { id: input.id },
        data: { healthScore: input.healthScore },
      });
      return { ok: true };
    }),

  healthAlerts: operatorProcedure.query(async ({ ctx }) => {
    return ctx.prisma.client.findMany({
      where: { healthScore: { lt: 60 } },
      orderBy: { healthScore: "asc" },
      take: 10,
      select: { id: true, name: true, healthScore: true, lastLoginAt: true, status: true },
    });
  }),

  triggerBatch: operatorProcedure
    .input(z.object({ id: z.string(), kind: z.enum(["pilot_minimum", "weekly_batch"]) }))
    .mutation(async ({ ctx, input }) => {
      const client = await ctx.prisma.client.findUnique({
        where: { id: input.id },
        include: { skus: true },
      });
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      if (client.skus.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Client has no SKUs" });
      }

      const planLimit = PLAN_LIMITS[client.plan];
      const unitsPerWeek =
        planLimit.billingPeriod === "one_time"
          ? (planLimit.totalUnits ?? 5)
          : Math.ceil((planLimit.monthlyUnits ?? 20) / 4);

      const styles = (client.selectedStyles as string[]).length > 0
        ? (client.selectedStyles as string[])
        : ["social_style", "editorial_hero"];

      const wk = weekKey();

      // Check if there are already units for this week
      const existing = await ctx.prisma.contentPlanItem.count({
        where: { clientId: client.id, weekKey: wk },
      });
      if (existing > 0) {
        // Re-enqueue planned/failed units instead of creating duplicates
        const stale = await ctx.prisma.contentPlanItem.findMany({
          where: { clientId: client.id, weekKey: wk, status: { in: ["planned", "failed"] } },
          select: { id: true },
        });
        if (stale.length === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `${existing} units already exist for ${wk} and are not in a retriable state`,
          });
        }
        const unitIds = stale.map((u) => u.id);
        if (input.kind === "weekly_batch") {
          await enqueueWeeklyBatch(unitIds);
        } else {
          await enqueuePilotMinimum(unitIds);
        }
        await ctx.prisma.contentPlanItem.updateMany({
          where: { id: { in: unitIds } },
          data: { status: "planned" },
        });
        return { ok: true, created: 0, enqueued: unitIds.length, weekKey: wk };
      }

      // Create ContentPlanItems across styles and SKUs
      const skuIds = client.skus.map((s) => s.id);
      const formats = ["static", "static", "short_motion"] as const;
      const channels = ["instagram", "instagram", "tiktok"] as const;
      const newUnitIds: string[] = [];

      let slot = 0;
      outer: for (const style of styles) {
        for (let fi = 0; fi < formats.length; fi++) {
          if (slot >= unitsPerWeek) break outer;
          const skuId = skuIds[slot % skuIds.length]!;
          const unit = await ctx.prisma.contentPlanItem.create({
            data: {
              clientId: client.id,
              skuId,
              weekKey: wk,
              weekIndex: 1,
              slotIndex: slot,
              stylePreset: style as never,
              format: formats[fi]!,
              primaryChannel: channels[fi]!,
              status: "planned",
              tags: [],
            },
          });
          newUnitIds.push(unit.id);
          slot++;
        }
      }

      if (input.kind === "weekly_batch") {
        await enqueueWeeklyBatch(newUnitIds);
      } else {
        await enqueuePilotMinimum(newUnitIds);
      }

      return { ok: true, created: newUnitIds.length, enqueued: newUnitIds.length, weekKey: wk };
    }),
});
