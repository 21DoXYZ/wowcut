import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, operatorProcedure, adminProcedure } from "../trpc";

export const operatorTrendsRouter = router({
  list: operatorProcedure.query(async ({ ctx }) => {
    return ctx.prisma.trendDrop.findMany({
      orderBy: { monthKey: "desc" },
      include: { assignments: true },
    });
  }),

  upsert: adminProcedure
    .input(
      z.object({
        monthKey: z.string(),
        theme: z.string().min(1),
        description: z.string(),
        presets: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.trendDrop.upsert({
        where: { monthKey: input.monthKey },
        update: {
          theme: input.theme,
          description: input.description,
          presets: input.presets as object,
        },
        create: {
          monthKey: input.monthKey,
          theme: input.theme,
          description: input.description,
          presets: input.presets as object,
        },
      });
    }),

  publish: adminProcedure
    .input(z.object({ monthKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const drop = await ctx.prisma.trendDrop.findUnique({ where: { monthKey: input.monthKey } });
      if (!drop) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.trendDrop.update({
        where: { monthKey: input.monthKey },
        data: { publishedAt: new Date() },
      });
      return { ok: true };
    }),
});
