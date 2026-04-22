import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, clientProcedure } from "../trpc";

export const libraryRouter = router({
  list: clientProcedure
    .input(
      z.object({
        query: z.string().optional(),
        favoritesOnly: z.boolean().optional(),
        trendOnly: z.boolean().optional(),
        style: z.string().optional(),
        format: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.libraryItem.findMany({
        where: {
          clientId: ctx.session.clientId!,
          ...(input.favoritesOnly ? { isFavorite: true } : {}),
          unit: {
            ...(input.trendOnly ? { isTrendDrop: true } : {}),
            ...(input.style ? { stylePreset: input.style as never } : {}),
            ...(input.format ? { format: input.format as never } : {}),
          },
        },
        include: {
          unit: { include: { sku: true, chosenGeneration: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }),

  toggleFavorite: clientProcedure
    .input(z.object({ libraryItemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.libraryItem.findFirst({
        where: { id: input.libraryItemId, clientId: ctx.session.clientId! },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      const updated = await ctx.prisma.libraryItem.update({
        where: { id: item.id },
        data: { isFavorite: !item.isFavorite },
      });
      return { isFavorite: updated.isFavorite };
    }),

  setTags: clientProcedure
    .input(z.object({ libraryItemId: z.string(), tags: z.array(z.string().max(24)).max(10) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.libraryItem.updateMany({
        where: { id: input.libraryItemId, clientId: ctx.session.clientId! },
        data: { tags: input.tags },
      });
      return { ok: true };
    }),

  stats: clientProcedure.query(async ({ ctx }) => {
    const [count, favs] = await Promise.all([
      ctx.prisma.libraryItem.count({ where: { clientId: ctx.session.clientId! } }),
      ctx.prisma.libraryItem.count({ where: { clientId: ctx.session.clientId!, isFavorite: true } }),
    ]);
    return { total: count, favorites: favs };
  }),
});
