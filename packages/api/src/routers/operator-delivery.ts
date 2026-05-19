import { z } from "zod";
import { weekKey } from "@wowcut/shared";
import { queues } from "@wowcut/queues";
import { router, operatorProcedure } from "../trpc";

export const operatorDeliveryRouter = router({
  weekSummary: operatorProcedure
    .input(z.object({ weekKey: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const wk = input.weekKey ?? weekKey();

      const [deliveries, unitsByStatus, activeClients] = await Promise.all([
        ctx.prisma.delivery.findMany({
          where: { weekKey: wk },
          include: {
            client: { select: { id: true, name: true, slug: true, plan: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.contentPlanItem.groupBy({
          by: ["status"],
          where: { weekKey: wk },
          _count: { status: true },
        }),
        ctx.prisma.client.findMany({
          where: { status: { in: ["active", "week_pass_active"] } },
          select: { id: true, name: true, slug: true, plan: true },
        }),
      ]);

      const deliveredClientIds = new Set(deliveries.map((d) => d.clientId));
      const blockers = activeClients.filter((c) => !deliveredClientIds.has(c.id));

      return { weekKey: wk, deliveries, unitsByStatus, blockers };
    }),

  recentWeeks: operatorProcedure.query(async ({ ctx }) => {
    const [deliveryRows, planRows] = await Promise.all([
      ctx.prisma.delivery.findMany({
        distinct: ["weekKey"],
        orderBy: { weekKey: "desc" },
        take: 12,
        select: { weekKey: true },
      }),
      ctx.prisma.contentPlanItem.findMany({
        distinct: ["weekKey"],
        orderBy: { weekKey: "desc" },
        take: 12,
        select: { weekKey: true },
      }),
    ]);
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const r of [...deliveryRows, ...planRows]) {
      if (!seen.has(r.weekKey)) { seen.add(r.weekKey); merged.push(r.weekKey); }
    }
    return merged.sort((a, b) => b.localeCompare(a)).slice(0, 12);
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

  runDelivery: operatorProcedure
    .input(z.object({ clientId: z.string().optional(), weekKey: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { deliveryQueue } = queues();
      await deliveryQueue.add(
        "manual-delivery",
        { clientId: input.clientId, weekKey: input.weekKey },
        { attempts: 2 },
      );
      return { ok: true };
    }),
});
