import { z } from "zod";
import { router, operatorProcedure } from "../trpc";

export const operatorPlanRouter = router({
  crossClientGrid: operatorProcedure
    .input(z.object({ weeksAhead: z.number().int().min(1).max(8).default(4) }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const weekKeys: string[] = [];
      for (let i = 0; i < input.weeksAhead; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i * 7);
        weekKeys.push(toWeekKey(d));
      }

      const [clients, items] = await Promise.all([
        ctx.prisma.client.findMany({
          where: { status: { in: ["active", "week_pass_active", "onboarding_confirm"] } },
          select: { id: true, name: true, slug: true, plan: true, healthScore: true },
          orderBy: { name: "asc" },
        }),
        ctx.prisma.contentPlanItem.findMany({
          where: { weekKey: { in: weekKeys } },
          select: {
            id: true,
            clientId: true,
            weekKey: true,
            status: true,
            stylePreset: true,
            format: true,
            isTrendDrop: true,
          },
        }),
      ]);

      type StatusCounts = Record<string, number>;
      const grid: Record<string, Record<string, StatusCounts>> = {};

      for (const client of clients) {
        grid[client.id] = {};
        for (const wk of weekKeys) {
          grid[client.id]![wk] = {};
        }
      }

      for (const item of items) {
        const cell = grid[item.clientId]?.[item.weekKey];
        if (cell) {
          cell[item.status] = (cell[item.status] ?? 0) + 1;
        }
      }

      return { weekKeys, clients, grid };
    }),

  bottlenecks: operatorProcedure.query(async ({ ctx }) => {
    const stuckStatuses = ["generating", "auto_qc", "needs_review", "assembling"] as const;
    const rows = await ctx.prisma.contentPlanItem.groupBy({
      by: ["status", "clientId"],
      where: { status: { in: [...stuckStatuses] } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const clientIds = [...new Set(rows.map((r) => r.clientId))];
    const clients = await ctx.prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true, slug: true },
    });
    const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

    return rows.map((r) => ({
      clientId: r.clientId,
      clientName: clientMap[r.clientId]?.name ?? r.clientId,
      clientSlug: clientMap[r.clientId]?.slug ?? r.clientId,
      status: r.status,
      count: r._count.id,
    }));
  }),
});

function toWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
