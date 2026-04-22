import { router, adminProcedure } from "../trpc";

export const operatorMetricsRouter = router({
  overview: adminProcedure.query(async ({ ctx }) => {
    const [totalClients, activeClients, totalUnits, deliveredUnits, previewsToday] = await Promise.all([
      ctx.prisma.client.count(),
      ctx.prisma.client.count({ where: { status: "active" } }),
      ctx.prisma.contentPlanItem.count(),
      ctx.prisma.contentPlanItem.count({ where: { status: "delivered" } }),
      ctx.prisma.preview.count({
        where: { createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    const mrr = activeClients * 250;

    return {
      totalClients,
      activeClients,
      mrr,
      totalUnits,
      deliveredUnits,
      previewsToday,
    };
  }),

  apiCostByDay: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.prisma.generation.groupBy({
      by: ["model"],
      _sum: { costUsd: true },
      where: { createdAt: { gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });
    return rows;
  }),

  capacityByOperator: adminProcedure.query(async () => {
    // TODO: join with operator assignments once Clerk users are linked to clients
    return [];
  }),
});
