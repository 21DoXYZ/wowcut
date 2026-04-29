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

  claimPreview: publicProcedure
    .input(
      z.object({
        previewId: z.string(),
        email: z.string().email(),
        brandName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { previewId, email, brandName } = input;

      // Upsert client — if they already have an account, just link; otherwise create pending
      const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
      const slug = `${base}-${Date.now().toString(36)}`;

      await ctx.prisma.client.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name: brandName || base,
          slug,
          status: "onboarding_confirm",
          plan: "base",
          toneOfVoice: "minimal",
        },
      });

      // Link the preview so ops can see it
      // Link the preview to the client record
      const client = await ctx.prisma.client.findUnique({ where: { email }, select: { id: true } });
      if (client) {
        await ctx.prisma.preview.update({
          where: { id: previewId },
          data: { convertedClientId: client.id },
        });
      }

      // Magic link is sent by the browser via signInWithOtp (PKCE flow).
      // This mutation only handles the DB side.
      return { ok: true };
    }),

  gallery: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(60).default(24) }))
    .query(async ({ ctx, input }) => {
      const previews = await ctx.prisma.preview.findMany({
        where: { status: "succeeded", moodboardImages: { not: {} as never } },
        orderBy: { createdAt: "desc" },
        take: input.limit * 3,
        select: { id: true, moodboardImages: true, createdAt: true },
      });

      type ImgMeta = {
        index: number;
        stylePreset: string;
        sceneHeadline: string;
        url: string;
        qcComposite: number;
      };

      const items: { previewId: string; image: ImgMeta }[] = [];
      for (const p of previews) {
        const imgs = (p.moodboardImages as ImgMeta[] | null) ?? [];
        const best = imgs
          .filter((img) => img.qcComposite >= 0.7)
          .sort((a, b) => b.qcComposite - a.qcComposite)
          .slice(0, 1);
        for (const img of best) {
          items.push({ previewId: p.id, image: img });
          if (items.length >= input.limit) break;
        }
        if (items.length >= input.limit) break;
      }

      return items;
    }),
});
