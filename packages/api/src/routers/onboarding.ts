import { TRPCError } from "@trpc/server";
import { schemas, slugify, weekKey as currentWeekKey, PLAN_LIMITS } from "@wowcut/shared";
import { enqueuePilotMinimum } from "@wowcut/queues";
import { router, clientProcedure } from "../trpc";

type PreviewStyle = "social_style" | "editorial_hero" | "cgi_concept";
type PlanStyle = PreviewStyle | "fashion_campaign";

export const onboardingRouter = router({
  status: clientProcedure.query(async ({ ctx }) => {
    const client = await ctx.prisma.client.findUnique({
      where: { id: ctx.session.clientId! },
      include: { skus: true },
    });
    if (!client) throw new TRPCError({ code: "NOT_FOUND" });

    let previewSummary: {
      favorites: Array<{ imageIndex: number; stylePreset: string; sceneId: string }>;
      moodboardImages: unknown;
      scenario: unknown;
      intake: unknown;
    } | null = null;

    if (client.convertedFromPreviewId) {
      const preview = await ctx.prisma.preview.findUnique({
        where: { id: client.convertedFromPreviewId },
        include: { favorites: true },
      });
      if (preview) {
        previewSummary = {
          favorites: preview.favorites.map((f) => ({
            imageIndex: f.imageIndex,
            stylePreset: f.stylePreset,
            sceneId: f.sceneId,
          })),
          moodboardImages: preview.moodboardImages,
          scenario: preview.scenario,
          intake: preview.intake,
        };
      }
    }

    return {
      status: client.status,
      plan: client.plan,
      brandName: client.name,
      logoUrl: client.logoUrl,
      brandColors: client.brandColors,
      selectedStyles: client.selectedStyles,
      skuCount: client.skus.length,
      previewSummary,
    };
  }),

  confirm: clientProcedure
    .input(schemas.ConfirmOnboardingSchema)
    .mutation(async ({ ctx, input }) => {
      const clientId = ctx.session.clientId!;
      const existing = await ctx.prisma.client.findUnique({ where: { id: clientId } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      // Idempotency: if already active with content plan, return ok.
      if (existing.status === "active") {
        const existingUnitCount = await ctx.prisma.contentPlanItem.count({
          where: { clientId },
        });
        if (existingUnitCount > 0) return { ok: true, alreadyActive: true };
      }

      const preview = existing.convertedFromPreviewId
        ? await ctx.prisma.preview.findUnique({
            where: { id: existing.convertedFromPreviewId },
            include: { favorites: true },
          })
        : null;

      if (!preview) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No preview linked to this client. Please start from /try.",
        });
      }
      if (preview.status !== "succeeded") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Preview is not ready (status: ${preview.status}). Wait or restart.`,
        });
      }

      const intake = preview.intake as schemas.BriefIntake | null;
      if (!intake) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Preview intake missing" });
      }

      const favoriteStyles = Array.from(
        new Set(preview.favorites.map((f) => f.stylePreset as PreviewStyle)),
      );
      const selectedStyles: PlanStyle[] =
        favoriteStyles.length > 0 ? favoriteStyles : ["editorial_hero", "social_style"];

      const brandName = input.brandNameOverride ?? intake.brandName ?? "New brand";
      const slug = existing.slug || slugify(brandName);

      // Determine week 1 unit count from plan
      const planLimit = PLAN_LIMITS[existing.plan];
      const totalWeek1Units = Math.min(
        planLimit.billingPeriod === "one_time"
          ? (planLimit.totalUnits ?? 5)
          : Math.ceil((planLimit.monthlyUnits ?? 20) / 4),
        intake.products.length * 3,
      );

      const weekKey = currentWeekKey();

      const newUnitIds = await ctx.prisma.$transaction(async (tx) => {
        await tx.client.update({
          where: { id: clientId },
          data: {
            name: brandName,
            slug,
            brandColors: [intake.brandColor, intake.secondaryColor].filter(Boolean) as string[],
            selectedStyles,
            toneOfVoice: input.toneOfVoice,
            channels: input.channels,
            brief: {
              intake,
              scenario: preview.scenario,
              favorites: preview.favorites.map((f) => ({
                imageIndex: f.imageIndex,
                stylePreset: f.stylePreset,
                sceneId: f.sceneId,
              })),
            } as object,
            status: existing.plan === "week_pass" ? "week_pass_active" : "active",
          },
        });

        // Replace pre-existing SKUs if any (idempotency of re-confirm)
        await tx.sku.deleteMany({ where: { clientId } });

        const createdSkus = await Promise.all(
          intake.products.map((product, i) =>
            tx.sku.create({
              data: {
                clientId,
                name: product.nameGuess ?? `Product ${i + 1}`,
                category: (product.category ?? "other") as never,
                shape: (product.shape ?? "other") as never,
                material: (product.material ?? "other") as never,
                primaryColor: product.dominantColor,
                imageUrl: product.imageUrl,
              },
            }),
          ),
        );

        // Build a deterministic week-1 plan. Rotate products × favorite scene styles.
        const favoritesByStyle: Record<PlanStyle, { sceneId: string }[]> = {
          social_style: [],
          editorial_hero: [],
          cgi_concept: [],
          fashion_campaign: [],
        };
        for (const fav of preview.favorites) {
          if (fav.stylePreset in favoritesByStyle) {
            favoritesByStyle[fav.stylePreset as PlanStyle].push({ sceneId: fav.sceneId });
          }
        }

        const units: { id: string }[] = [];
        const channel = input.channels[0] ?? "instagram";
        for (let slot = 0; slot < totalWeek1Units; slot++) {
          const product = createdSkus[slot % createdSkus.length]!;
          const style = selectedStyles[slot % selectedStyles.length]!;
          const sceneCandidate = favoritesByStyle[style][slot % (favoritesByStyle[style].length || 1)];
          const unit = await tx.contentPlanItem.create({
            data: {
              clientId,
              weekKey,
              weekIndex: 1,
              slotIndex: slot,
              skuId: product.id,
              stylePreset: style as never,
              format: "static",
              primaryChannel: channel,
              aspectRatios: ["1:1", "4:5"],
              status: "planned",
              tags: [],
              sourcePreviewSceneId: sceneCandidate?.sceneId ?? null,
            },
          });
          units.push({ id: unit.id });
        }
        return units.map((u) => u.id);
      });

      // Enqueue generation (outside transaction — Redis ops mustn't block DB)
      try {
        await enqueuePilotMinimum(newUnitIds);
      } catch (err) {
        console.error("[onboarding] enqueue failed", err);
        // Content plan exists; next weekly batch can pick up. Do not fail the request.
      }

      return { ok: true, unitsQueued: newUnitIds.length };
    }),
});
