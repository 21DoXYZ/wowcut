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
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(40),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.libraryItem.findMany({
        where: {
          clientId: ctx.session.clientId!,
          ...(input.cursor ? { id: { lt: input.cursor } } : {}),
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
        orderBy: { id: "desc" },
        take: input.limit + 1,
      });
      const hasMore = items.length > input.limit;
      return {
        items: hasMore ? items.slice(0, input.limit) : items,
        nextCursor: hasMore ? items[input.limit - 1]?.id : undefined,
      };
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
