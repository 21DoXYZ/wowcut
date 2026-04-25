import { Worker } from "bullmq";
import { QUEUE_NAMES, PREVIEW, type schemas } from "@wowcut/shared";
import {
  generateScenario,
  assembleMoodboardPrompt,
  generateGeminiImage,
  inferProductFromImage,
  runQc,
  STYLE_PRESETS,
} from "@wowcut/ai";

type PreviewStyle = "social_style" | "editorial_hero" | "cgi_concept" | "fashion_campaign";
import { prisma } from "@wowcut/db";
import { uploadObject } from "@wowcut/storage";
import { redis } from "./redis";

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

    const productImages = await Promise.all(intake.products.map((p) => fetchAsBase64(p.imageUrl)));
    const referenceImages = await Promise.all(
      intake.references.map((r) => fetchAsBase64(r.imageUrl)),
    );

    // Infer product attributes from the first product image using Gemini Vision.
    // This gives us a concrete product description for the image generation prompt.
    const productInference = productImages[0]
      ? await inferProductFromImage(productImages[0])
      : undefined;

    if (productInference) {
      console.log(`[preview] product inferred: ${productInference.nameGuess} (${productInference.category})`);
    }

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

    const styles: PreviewStyle[] = selectedStyles.filter(
      (s) => scenarioResult.scenario.sceneVariantsByStyle[s as keyof typeof scenarioResult.scenario.sceneVariantsByStyle],
    );
    const finalImages: schemas.MoodboardImageMeta[] = [];
    let totalCost = scenarioResult.costUsd;
    let globalIndex = 0;

    for (const style of styles) {
      const scenes = scenarioResult.scenario.sceneVariantsByStyle[style as keyof typeof scenarioResult.scenario.sceneVariantsByStyle];
      if (!scenes) continue;
      const profile = (await loadStyleProfile(style)) as unknown as import("@wowcut/ai").StyleProfile;

      for (const scene of scenes) {
        const candidates: {
          url: string;
          seed: number;
          qcComposite: number;
          costUsd: number;
        }[] = [];

        for (let seedIdx = 0; seedIdx < PREVIEW.seedsPerScene; seedIdx++) {
          const assembled = assembleMoodboardPrompt({
            stylePreset: style,
            scene,
            scenario: scenarioResult.scenario,
            product: intake.products[0]!,
            productInference,
            isPreview: true,
          });

          try {
            const result = await generateGeminiImage({
              model: "nano_banana_2",
              prompt: assembled.prompt,
              negative: assembled.negative,
              references:
                productImages.length && referenceImages.length
                  ? [
                      productImages[0]!,
                      referenceImages[Math.min(seedIdx, referenceImages.length - 1)]!,
                    ]
                  : productImages,
              aspectRatio: assembled.aspectRatio,
              seed: assembled.seed,
            });

            const candidateKey = `previews/${preview.id}/scene-${scene.id}-seed${seedIdx}.jpg`;
            const buffer = Buffer.from(result.imageBase64, "base64");
            const url = await uploadObject({
              key: candidateKey,
              body: buffer,
              contentType: result.mimeType,
            });

            const preset = STYLE_PRESETS[style];
            const mediaType: "image/jpeg" | "image/png" | "image/webp" =
              result.mimeType.includes("png")
                ? "image/png"
                : result.mimeType.includes("webp")
                  ? "image/webp"
                  : "image/jpeg";
            const qc = await runQc({
              preset,
              profile,
              generatedImageUrl: url,
              productImageUrl: intake.products[0]!.imageUrl,
              referenceImageUrls: intake.references.map((r) => r.imageUrl),
              brandColorsHex: [intake.brandColor, intake.secondaryColor].filter(Boolean) as string[],
              prompt: assembled.prompt,
              generatedImageBase64: result.imageBase64,
              generatedImageMediaType: mediaType,
            });

            candidates.push({
              url,
              seed: assembled.seed,
              qcComposite: qc.composite,
              costUsd: result.costUsd + 0.015,
            });
            totalCost += result.costUsd + 0.015;
          } catch (err) {
            console.error(`[preview] scene ${scene.id} seed ${seedIdx} failed`, err);
          }
        }

        if (candidates.length === 0) {
          throw new Error(`All ${PREVIEW.seedsPerScene} seeds failed for scene ${scene.id}`);
        }

        candidates.sort((a, b) => b.qcComposite - a.qcComposite);
        const winner = candidates[0]!;

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
    }

    await prisma.preview.update({
      where: { id: preview.id },
      data: {
        status: "succeeded",
        moodboardImages: finalImages as unknown as object,
        costUsd: totalCost,
      },
    });
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
