import { z } from "zod";
import { router, operatorProcedure } from "../trpc";

export const operatorDeliveryRouter = router({
  weekSummary: operatorProcedure
    .input(z.object({ weekKey: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const weekKey =
        input.weekKey ??
        new Date().toISOString().slice(0, 10).replace(/-/g, "-W").slice(0, 8) +
          getWeekNumber(new Date());

      const [deliveries, unitsByStatus, activeClients] = await Promise.all([
        ctx.prisma.delivery.findMany({
          where: { weekKey },
          include: {
            client: { select: { id: true, name: true, slug: true, plan: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.contentPlanItem.groupBy({
          by: ["status"],
          where: { weekKey },
          _count: { status: true },
        }),
        ctx.prisma.client.findMany({
          where: { status: { in: ["active", "week_pass_active"] } },
          select: { id: true, name: true, slug: true, plan: true },
        }),
      ]);

      const deliveredClientIds = new Set(deliveries.map((d) => d.clientId));
      const blockers = activeClients.filter((c) => !deliveredClientIds.has(c.id));

      return { weekKey, deliveries, unitsByStatus, blockers };
    }),

  recentWeeks: operatorProcedure.query(async ({ ctx }) => {
    const rows = await ctx.prisma.delivery.findMany({
      distinct: ["weekKey"],
      orderBy: { weekKey: "desc" },
      take: 12,
      select: { weekKey: true },
    });
    return rows.map((r) => r.weekKey);
  }),

  clientWeekDetail: operatorProcedure
    .input(z.object({ clientId: z.string(), weekKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const [items, delivery] = await Promise.all([
        ctx.prisma.contentPlanItem.findMany({
          where: { clientId: input.clientId, weekKey: input.weekKey },
          include: {
            sku: { select: { name: true, category: true, imageUrl: true } },
            chosenGeneration: { select: { outputUrl: true, qcComposite: true } },
          },
          orderBy: { slotIndex: "asc" },
        }),
        ctx.prisma.delivery.findFirst({
          where: { clientId: input.clientId, weekKey: input.weekKey },
        }),
      ]);
      return { items, delivery };
    }),
});

function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return String(Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)).padStart(
    2,
    "0",
  );
}
