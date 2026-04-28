import { router, operatorProcedure } from "../trpc";

export const operatorQueueRouter = router({
  generationStatus: operatorProcedure.query(async ({ ctx }) => {
    const [byStatus, recentFailed, recentSucceeded] = await Promise.all([
      ctx.prisma.contentPlanItem.groupBy({
        by: ["status"],
        _count: { id: true },
        where: {
          status: {
            in: ["planned", "generating", "auto_qc", "needs_review", "ready", "assembling"],
          },
        },
      }),
      ctx.prisma.generation.findMany({
        where: { status: "failed" },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          model: true,
          errorMessage: true,
          costUsd: true,
          latencyMs: true,
          updatedAt: true,
          unit: {
            select: {
              id: true,
              weekKey: true,
              stylePreset: true,
              client: { select: { name: true, slug: true } },
            },
          },
        },
      }),
      ctx.prisma.generation.findMany({
        where: { status: "succeeded" },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          model: true,
          costUsd: true,
          latencyMs: true,
          qcComposite: true,
          autoApproved: true,
          updatedAt: true,
          unit: {
            select: {
              id: true,
              weekKey: true,
              stylePreset: true,
              client: { select: { name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    return { byStatus, recentFailed, recentSucceeded };
  }),

  assemblyStatus: operatorProcedure.query(async ({ ctx }) => {
    const [assembling, recentDelivered] = await Promise.all([
      ctx.prisma.contentPlanItem.findMany({
        where: { status: "assembling" },
        include: {
          client: { select: { name: true, slug: true } },
          sku: { select: { name: true } },
          chosenGeneration: { select: { outputUrl: true, qcComposite: true } },
        },
        orderBy: { updatedAt: "asc" },
        take: 50,
      }),
      ctx.prisma.delivery.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          client: { select: { name: true, slug: true } },
          items: { select: { id: true, status: true } },
        },
      }),
    ]);

    return { assembling, recentDelivered };
  }),
});
