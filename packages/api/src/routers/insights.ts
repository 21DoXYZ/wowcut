import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, clientProcedure } from "../trpc";

const EntrySchema = z.object({
  unitId: z.string().optional(),
  channel: z.string().min(1),
  postedAt: z.string().datetime().optional(),
  likes: z.number().int().nonnegative().optional(),
  saves: z.number().int().nonnegative().optional(),
  comments: z.number().int().nonnegative().optional(),
  shares: z.number().int().nonnegative().optional(),
  views: z.number().int().nonnegative().optional(),
  freeText: z.string().max(500).optional(),
});

export const insightsRouter = router({
  list: clientProcedure.query(async ({ ctx }) => {
    return ctx.prisma.insightEntry.findMany({
      where: { clientId: ctx.session.clientId! },
      orderBy: { postedAt: "desc" },
      take: 100,
    });
  }),

  create: clientProcedure.input(EntrySchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.insightEntry.create({
      data: {
        clientId: ctx.session.clientId!,
        unitId: input.unitId,
        channel: input.channel,
        postedAt: input.postedAt ? new Date(input.postedAt) : undefined,
        likes: input.likes,
        saves: input.saves,
        comments: input.comments,
        shares: input.shares,
        views: input.views,
        freeText: input.freeText,
      },
    });
  }),

  remove: clientProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const entry = await ctx.prisma.insightEntry.findFirst({
      where: { id: input.id, clientId: ctx.session.clientId! },
    });
    if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
    await ctx.prisma.insightEntry.delete({ where: { id: entry.id } });
    return { ok: true };
  }),

  summary: clientProcedure.query(async ({ ctx }) => {
    const entries = await ctx.prisma.insightEntry.findMany({
      where: { clientId: ctx.session.clientId! },
      include: { /* unit summary joined client-side for now */ },
      orderBy: { postedAt: "desc" },
      take: 200,
    });

    const totals = entries.reduce(
      (acc, e) => {
        acc.likes += e.likes ?? 0;
        acc.saves += e.saves ?? 0;
        acc.comments += e.comments ?? 0;
        acc.shares += e.shares ?? 0;
        return acc;
      },
      { likes: 0, saves: 0, comments: 0, shares: 0 },
    );

    return { entries: entries.length, totals };
  }),
});
