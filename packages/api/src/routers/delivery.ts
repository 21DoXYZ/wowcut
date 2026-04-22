import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, clientProcedure } from "../trpc";

export const deliveryRouter = router({
  listWeeks: clientProcedure.query(async ({ ctx }) => {
    return ctx.prisma.delivery.findMany({
      where: { clientId: ctx.session.clientId! },
      orderBy: { weekKey: "desc" },
      take: 8,
      select: { id: true, weekKey: true, publishingPackUrl: true, emailSentAt: true, createdAt: true },
    });
  }),

  byWeek: clientProcedure
    .input(z.object({ weekKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const delivery = await ctx.prisma.delivery.findUnique({
        where: { clientId_weekKey: { clientId: ctx.session.clientId!, weekKey: input.weekKey } },
        include: {
          items: {
            include: { sku: true, chosenGeneration: true },
            orderBy: { slotIndex: "asc" },
          },
          retryRequests: true,
        },
      });
      return delivery;
    }),

  requestRetry: clientProcedure
    .input(z.object({ unitId: z.string(), reason: z.string(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const unit = await ctx.prisma.contentPlanItem.findFirst({
        where: { id: input.unitId, clientId: ctx.session.clientId! },
      });
      if (!unit || !unit.deliveryId) throw new TRPCError({ code: "NOT_FOUND" });

      const existing = await ctx.prisma.retryRequest.count({
        where: { deliveryId: unit.deliveryId, unitId: input.unitId, status: "pending" },
      });
      if (existing > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Retry already requested" });
      }

      await ctx.prisma.retryRequest.create({
        data: {
          deliveryId: unit.deliveryId,
          unitId: input.unitId,
          reason: input.reason,
          note: input.note,
        },
      });
      await ctx.prisma.contentPlanItem.update({
        where: { id: input.unitId },
        data: { status: "retry_requested" },
      });
      return { ok: true };
    }),

  rateWeek: clientProcedure
    .input(z.object({ weekKey: z.string(), rating: z.number().int().min(1).max(5) }))
    .mutation(async ({ ctx, input }) => {
      const client = await ctx.prisma.client.findUnique({ where: { id: ctx.session.clientId! } });
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.briefUpdate.create({
        data: {
          clientId: client.id,
          source: "client_self",
          changes: { type: "weekly_rating", weekKey: input.weekKey, rating: input.rating },
        },
      });
      const ratingImpact = (input.rating - 3) * 2;
      await ctx.prisma.client.update({
        where: { id: client.id },
        data: { healthScore: Math.max(0, Math.min(100, client.healthScore + ratingImpact)) },
      });
      return { ok: true };
    }),
});
