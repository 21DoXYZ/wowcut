import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
});
