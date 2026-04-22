import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { schemas, PREVIEW } from "@wowcut/shared";
import { enqueuePreview } from "@wowcut/queues";
import { router, publicProcedure } from "../trpc";

const CreatePreviewInput = z.object({
  ipHash: z.string().min(1),
  intake: schemas.BriefIntakeSchema,
});

export const previewRouter = router({
  create: publicProcedure.input(CreatePreviewInput).mutation(async ({ ctx, input }) => {
    const since = new Date(Date.now() - PREVIEW.cacheTtlSeconds * 1000);
    const recent = await ctx.prisma.preview.count({
      where: { ipHash: input.ipHash, createdAt: { gt: since } },
    });
    if (recent >= PREVIEW.ratePerIpPerDay) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Preview limit reached (${PREVIEW.ratePerIpPerDay}/day). Try again tomorrow.`,
      });
    }

    const preview = await ctx.prisma.preview.create({
      data: {
        ipHash: input.ipHash,
        intake: input.intake as unknown as object,
        status: "intake",
      },
    });

    // Kick off background generation. If Redis is unreachable, mark preview
    // failed immediately so the client sees a clear error rather than hanging.
    try {
      await enqueuePreview(preview.id);
    } catch (err) {
      await ctx.prisma.preview.update({
        where: { id: preview.id },
        data: {
          status: "failed",
          failureReason: `queue_error:${(err as Error).message}`.slice(0, 400),
        },
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not start preview rendering. Try again.",
      });
    }

    return { id: preview.id };
  }),

  status: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const preview = await ctx.prisma.preview.findUnique({
      where: { id: input.id },
      include: { favorites: true },
    });
    if (!preview) throw new TRPCError({ code: "NOT_FOUND" });
    return {
      id: preview.id,
      status: preview.status,
      failureReason: preview.failureReason,
      scenario: preview.scenario,
      moodboardImages: preview.moodboardImages,
      favorites: preview.favorites,
      intake: preview.intake,
    };
  }),

  favorite: publicProcedure
    .input(
      z.object({
        previewId: z.string(),
        imageIndex: z.number().int().min(0).max(8),
        stylePreset: z.string(),
        sceneId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.moodboardFavorite.findUnique({
        where: {
          previewId_imageIndex: {
            previewId: input.previewId,
            imageIndex: input.imageIndex,
          },
        },
      });
      if (existing) {
        await ctx.prisma.moodboardFavorite.delete({ where: { id: existing.id } });
        return { favorited: false };
      }
      await ctx.prisma.moodboardFavorite.create({
        data: {
          previewId: input.previewId,
          imageIndex: input.imageIndex,
          stylePreset: input.stylePreset,
          sceneId: input.sceneId,
        },
      });
      return { favorited: true };
    }),

  listFavorites: publicProcedure
    .input(z.object({ previewId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.moodboardFavorite.findMany({
        where: { previewId: input.previewId },
        orderBy: { imageIndex: "asc" },
      });
    }),
});
