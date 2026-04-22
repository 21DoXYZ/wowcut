import { Worker } from "bullmq";
import { QUEUE_NAMES, QC_THRESHOLDS_DEFAULT } from "@wowcut/shared";
import { STYLE_PRESETS, runQc, type StylePresetId, type StyleProfile } from "@wowcut/ai";
import { prisma } from "@wowcut/db";
import { redis } from "./redis";
import { assemblyQueue } from "./queues";

export interface QcJobData {
  generationId: string;
}

async function loadProfile(stylePreset: string): Promise<StyleProfile> {
  const profile = await prisma.qcStyleProfile.findUnique({ where: { stylePreset } });
  if (!profile) throw new Error(`QC profile missing for ${stylePreset}`);
  return profile as unknown as StyleProfile;
}

async function fetchAsBase64(
  url: string,
): Promise<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/webp" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const mediaType: "image/jpeg" | "image/png" | "image/webp" = contentType.includes("png")
      ? "image/png"
      : contentType.includes("webp")
        ? "image/webp"
        : "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());
    return { base64: buffer.toString("base64"), mediaType };
  } catch {
    return null;
  }
}

export const qcWorker = new Worker<QcJobData>(
  QUEUE_NAMES.qc,
  async (job) => {
    const generation = await prisma.generation.findUnique({
      where: { id: job.data.generationId },
      include: { unit: { include: { client: true, sku: true } } },
    });
    if (!generation || !generation.outputUrl) throw new Error("Generation missing output");
    if (!generation.unit) return;

    const preset = STYLE_PRESETS[generation.unit.stylePreset as StylePresetId];
    const profile = await loadProfile(generation.unit.stylePreset);

    // Fetch generated image for Claude Haiku vision judge (prompt fidelity + composition).
    const imageForVision = await fetchAsBase64(generation.outputUrl);

    const qc = await runQc({
      preset,
      profile,
      generatedImageUrl: generation.outputUrl,
      productImageUrl: generation.unit.sku.imageUrl,
      referenceImageUrls: [],
      brandColorsHex: generation.unit.client.brandColors,
      prompt: generation.promptCompiled,
      ...(imageForVision
        ? {
            generatedImageBase64: imageForVision.base64,
            generatedImageMediaType: imageForVision.mediaType,
          }
        : {}),
    });

    // Sample 5% of auto-approved into confidence queue
    const shouldSampleForConfidence =
      qc.autoApproved && Math.random() < QC_THRESHOLDS_DEFAULT.confidenceSampleRate;

    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        qcResult: qc as unknown as object,
        qcVerdict: qc.verdict,
        qcComposite: qc.composite,
        qcProductIdentity: qc.metrics.productIdentity,
        qcPromptFidelity: qc.metrics.promptFidelity,
        qcAesthetic: qc.metrics.aestheticQuality,
        qcBrandColor: qc.metrics.brandColorMatch,
        qcComposition: qc.metrics.compositionQuality,
        qcReferenceAlign: qc.metrics.referenceAlignment,
        autoApproved: qc.autoApproved,
        sampledForConfidence: shouldSampleForConfidence,
      },
    });

    if (qc.verdict === "fail") {
      await prisma.contentPlanItem.update({
        where: { id: generation.unit.id },
        data: { status: "failed" },
      });
      return;
    }

    if (qc.autoApproved) {
      await prisma.contentPlanItem.update({
        where: { id: generation.unit.id },
        data: {
          chosenGenerationId: generation.id,
          status: "ready",
        },
      });
      await assemblyQueue.add("assembly", { unitId: generation.unit.id });
    } else {
      await prisma.contentPlanItem.update({
        where: { id: generation.unit.id },
        data: { status: "needs_review" },
      });
    }
  },
  { connection: redis, concurrency: 10 },
);

qcWorker.on("failed", (job, err) => console.error("[qc] failed", job?.id, err.message));
