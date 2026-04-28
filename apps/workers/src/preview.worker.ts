import fs from "node:fs/promises";
import { Worker } from "bullmq";
import { QUEUE_NAMES, PREVIEW, type schemas } from "@wowcut/shared";
import {
  generateScenario,
  assembleMoodboardPrompt,
  routeProvider,
  inferProductFromImage,
  runQc,
  STYLE_PRESETS,
} from "@wowcut/ai";

type PreviewStyle = "social_style" | "editorial_hero" | "cgi_concept" | "fashion_campaign";
import { prisma } from "@wowcut/db";
import { uploadObject } from "@wowcut/storage";
import { redis } from "./redis";
import { renderComposition } from "./remotion-render";
import { mapUnitToComposition } from "./assembly-mapping";

// The model used for preview image generation.
// Change this constant to swap providers without touching business logic.
const PREVIEW_IMAGE_MODEL = "nano_banana_2" as const;

export interface PreviewJobData {
  previewId: string;
}

async function fetchAsBase64(
  url: string,
): Promise<{ mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const mediaType =
    contentType.includes("png")
      ? "image/png"
      : contentType.includes("webp")
        ? "image/webp"
        : "image/jpeg";
  const arrayBuffer = await res.arrayBuffer();
  const data = Buffer.from(arrayBuffer).toString("base64");
  return { mediaType, data };
}

async function loadStyleProfile(stylePreset: string) {
  const profile = await prisma.qcStyleProfile.findUnique({ where: { stylePreset } });
  if (!profile) throw new Error(`QC profile missing for ${stylePreset}`);
  return profile;
}

/**
 * Extract base64 and mimeType from a data URL returned by provider.generate().
 * e.g. "data:image/png;base64,AAAA..." → { base64: "AAAA...", mimeType: "image/png" }
 */
function parseDataUrl(dataUrl: string): { base64: string; mimeType: string } {
  const [meta, base64] = dataUrl.split(";base64,");
  const mimeType = (meta ?? "data:image/png").replace("data:", "");
  return { base64: base64 ?? "", mimeType };
}

export const previewWorker = new Worker<PreviewJobData>(
  QUEUE_NAMES.preview,
  async (job) => {
    const preview = await prisma.preview.findUnique({ where: { id: job.data.previewId } });
    if (!preview) throw new Error(`Preview ${job.data.previewId} not found`);
    const intake = preview.intake as schemas.BriefIntake | null;
    if (!intake) throw new Error(`Preview ${preview.id} has no intake`);

    await prisma.preview.update({
      where: { id: preview.id },
      data: { status: "generating" },
    });

    // ── 1. Fetch uploaded images ──────────────────────────────────────────────
    const productImages = await Promise.all(intake.products.map((p) => fetchAsBase64(p.imageUrl)));
    const referenceImages = await Promise.all(
      intake.references.map((r) => fetchAsBase64(r.imageUrl)),
    );

    // ── 2. Infer product from image (provider-agnostic via Gemini Flash Vision) ──
    const productInference = productImages[0]
      ? await inferProductFromImage(productImages[0])
      : undefined;

    if (productInference) {
      console.log(`[preview] product: ${productInference.nameGuess} (${productInference.category})`);
    }

    // ── 3. Generate scenario (Gemini 2.5 Pro sees product + reference images) ──
    const selectedStyles: PreviewStyle[] =
      (intake.selectedStyles as PreviewStyle[] | undefined)?.length
        ? (intake.selectedStyles as PreviewStyle[])
        : ["social_style", "editorial_hero", "cgi_concept"];

    const scenarioResult = await generateScenario({
      intake,
      productImages,
      referenceImages,
      selectedStyles,
    });

    await prisma.preview.update({
      where: { id: preview.id },
      data: { scenario: scenarioResult.scenario as unknown as object },
    });

    // ── 4. Generate images via provider router ────────────────────────────────
    const provider = routeProvider(PREVIEW_IMAGE_MODEL);
    const styles: PreviewStyle[] = selectedStyles.filter(
      (s) => scenarioResult.scenario.sceneVariantsByStyle[s as keyof typeof scenarioResult.scenario.sceneVariantsByStyle],
    );
    const finalImages: (schemas.MoodboardImageMeta & { videoUrl?: string })[] = [];
    let totalCost = scenarioResult.costUsd;
    let globalIndex = 0;

    // Fetch all style profiles up-front (single batch instead of per-style sequential calls)
    const profileMap = Object.fromEntries(
      await Promise.all(
        styles.map(async (s) => [s, (await loadStyleProfile(s)) as unknown as import("@wowcut/ai").StyleProfile])
      )
    );

    for (const style of styles) {
      const scenes = scenarioResult.scenario.sceneVariantsByStyle[
        style as keyof typeof scenarioResult.scenario.sceneVariantsByStyle
      ];
      if (!scenes) continue;

      const profile = profileMap[style]!;
      const styleImageUrls: string[] = [];

      // Generate all scenes within this style in parallel
      const sceneResults = await Promise.all(
        scenes.map(async (scene) => {
          // Generate all seeds for this scene in parallel
          const seedResults = await Promise.allSettled(
            Array.from({ length: PREVIEW.seedsPerScene }, async (_, seedIdx) => {
              const assembled = assembleMoodboardPrompt({
                stylePreset: style,
                scene,
                scenario: scenarioResult.scenario,
                product: intake.products[0]!,
                productInference,
                isPreview: true,
              });

              const productRef = productImages[0]
                ? [`data:${productImages[0].mediaType};base64,${productImages[0].data}`]
                : [];

              const genResult = await provider.generate({
                model: PREVIEW_IMAGE_MODEL,
                compiled: {
                  prompt: assembled.prompt,
                  negative: assembled.negative,
                  params: { seed: assembled.seed },
                  referenceImages: productRef,
                },
                format: "static",
                aspectRatio: assembled.aspectRatio,
              });

              const { base64, mimeType } = parseDataUrl(genResult.outputUrl);
              const candidateKey = `previews/${preview.id}/scene-${scene.id}-seed${seedIdx}.jpg`;
              const buffer = Buffer.from(base64, "base64");
              const url = await uploadObject({
                key: candidateKey,
                body: buffer,
                contentType: mimeType,
              });

              const preset = STYLE_PRESETS[style];
              const mediaType: "image/jpeg" | "image/png" | "image/webp" =
                mimeType.includes("png") ? "image/png"
                : mimeType.includes("webp") ? "image/webp"
                : "image/jpeg";

              const qc = await runQc({
                preset,
                profile,
                generatedImageUrl: url,
                productImageUrl: intake.products[0]!.imageUrl,
                referenceImageUrls: intake.references.map((r) => r.imageUrl),
                brandColorsHex: [intake.brandColor, intake.secondaryColor].filter(Boolean) as string[],
                prompt: assembled.prompt,
                generatedImageBase64: base64,
                generatedImageMediaType: mediaType,
              });

              return { url, base64, mimeType, seed: assembled.seed, qcComposite: qc.composite, costUsd: genResult.costUsd };
            })
          );

          const candidates = seedResults
            .filter((r): r is PromiseFulfilledResult<{ url: string; base64: string; mimeType: string; seed: number; qcComposite: number; costUsd: number }> => r.status === "fulfilled")
            .map((r) => r.value);

          seedResults
            .filter((r): r is PromiseRejectedResult => r.status === "rejected")
            .forEach((r, i) => console.error(`[preview] scene ${scene.id} seed ${i} failed`, r.reason));

          if (candidates.length === 0) {
            throw new Error(`All ${PREVIEW.seedsPerScene} seeds failed for scene ${scene.id}`);
          }

          candidates.sort((a, b) => b.qcComposite - a.qcComposite);
          const winner = candidates[0]!;
          totalCost += candidates.reduce((sum, c) => sum + c.costUsd, 0);
          return { scene, winner };
        })
      );

      for (const { scene, winner } of sceneResults) {
        styleImageUrls.push(winner.url);
        finalImages.push({
          index: globalIndex,
          stylePreset: style,
          sceneId: scene.id,
          sceneHeadline: scene.headline,
          url: winner.url,
          seed: winner.seed,
          qcComposite: winner.qcComposite,
          costUsd: winner.costUsd,
        });
        globalIndex++;
      }

      // ── 5. Assemble video reel for this style using Remotion ────────────────
      try {
        const mapping = mapUnitToComposition({
          stylePreset: style as Parameters<typeof mapUnitToComposition>[0]["stylePreset"],
          format: "short_motion",
          images: styleImageUrls,
          brandName: intake.brandName ?? "Brand",
          brandColor: intake.brandColor,
          productName: productInference?.nameGuess ?? intake.products[0]?.nameGuess ?? "Product",
          caption: scenarioResult.scenario.moodKeywords.slice(0, 3).join(" · "),
          ctaText: "Shop now",
        });

        const render = await renderComposition({
          compositionId: mapping.compositionId,
          inputProps: mapping.inputProps,
          kind: "video",
          outputKey: `previews/${preview.id}/reel-${style}.mp4`,
        });

        const videoBody = await fs.readFile(render.filePath);
        const videoUrl = await uploadObject({
          key: `previews/${preview.id}/reel-${style}.mp4`,
          body: videoBody,
          contentType: "video/mp4",
        });
        await fs.unlink(render.filePath).catch(() => {});

        // Attach videoUrl to the first image of this style so the client can find it
        const firstStyleImg = finalImages.find((img) => img.stylePreset === style);
        if (firstStyleImg) (firstStyleImg as Record<string, unknown>).videoUrl = videoUrl;

        console.log(`[preview] reel ready for ${style}: ${videoUrl}`);
      } catch (err) {
        console.error(`[preview] reel failed for ${style} (non-fatal):`, (err as Error).message);
      }
    }

    await prisma.preview.update({
      where: { id: preview.id },
      data: {
        status: "succeeded",
        moodboardImages: finalImages as unknown as object,
        costUsd: totalCost,
      },
    });

    console.log(`[preview] ✓ ${finalImages.length} images, ${styles.length} reels`);
  },
  {
    connection: redis,
    concurrency: 3,
    lockDuration: PREVIEW.timeoutMs + 60_000,
  },
);

previewWorker.on("failed", async (job, err) => {
  if (job) {
    await prisma.preview
      .update({
        where: { id: job.data.previewId },
        data: { status: "failed", failureReason: err.message.slice(0, 500) },
      })
      .catch(() => {});
  }
  console.error("[preview] failed", job?.id, err.message);
});
