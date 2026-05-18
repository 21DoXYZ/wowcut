import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@wowcut/shared";
import {
  STYLE_PRESETS,
  compilePrompt,
  routeProvider,
  fallbackModel,
  type StylePresetId,
} from "@wowcut/ai";
import { prisma } from "@wowcut/db";
import { uploadObject, R2Keys } from "@wowcut/storage";
import { redis } from "./redis";
import { enqueueQc, enqueueSeedancePoll } from "./queues";

function parseDataUrl(dataUrl: string): { base64: string; mimeType: string } {
  const [meta, base64] = dataUrl.split(";base64,");
  const mimeType = (meta ?? "data:image/png").replace("data:", "");
  return { base64: base64 ?? "", mimeType };
}

async function persistOutputUrl(generationId: string, outputUrl: string): Promise<string> {
  if (!outputUrl.startsWith("data:")) return outputUrl;
  const { base64, mimeType } = parseDataUrl(outputUrl);
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("mp4") ? "mp4" : "jpg";
  const key = R2Keys.generation(generationId, ext as "jpg" | "mp4" | "png");
  return uploadObject({ key, body: Buffer.from(base64, "base64"), contentType: mimeType });
}

export interface GenerationJobData {
  unitId: string;
  alternateIndex: number;
  kind: "pilot_minimum" | "pilot_full" | "weekly_batch" | "retry" | "trend_drop";
}

export const generationWorker = new Worker<GenerationJobData>(
  QUEUE_NAMES.generation,
  async (job) => {
    const unit = await prisma.contentPlanItem.findUnique({
      where: { id: job.data.unitId },
      include: { sku: true, client: true },
    });
    if (!unit) throw new Error(`Unit ${job.data.unitId} not found`);

    const preset = STYLE_PRESETS[unit.stylePreset as StylePresetId];
    const modelToUse =
      unit.format === "short_motion" && preset.motionModel ? preset.motionModel : preset.preferredModel;

    const compiled = compilePrompt({
      preset,
      product: {
        name: unit.sku.name,
        category: unit.sku.category,
        shape: unit.sku.shape,
        material: unit.sku.material,
        primaryColor: unit.sku.primaryColor,
        imageUrl: unit.sku.imageUrl,
        notes: unit.sku.notes,
      },
      client: {
        toneOfVoice: unit.client.toneOfVoice,
        brandColors: unit.client.brandColors,
        brandFaceId: unit.client.brandFaceId,
      },
      format: unit.format,
    });

    const generation = await prisma.generation.create({
      data: {
        unitId: unit.id,
        model: modelToUse,
        promptCompiled: compiled.prompt,
        seed: compiled.params.seed as number,
        alternateIndex: job.data.alternateIndex,
        status: "running",
      },
    });

    let tries = 0;
    let activeModel = modelToUse;
    while (tries < 3) {
      try {
        const provider = routeProvider(activeModel);
        const started = Date.now();
        const result = await provider.generate({
          model: activeModel,
          compiled,
          format: unit.format,
          aspectRatio: (compiled.params.aspectRatio as string) ?? "1:1",
        });

        const asyncPending = Boolean(result.providerMeta.asyncPending);
        const seedanceTaskId = result.providerMeta.seedanceTaskId as string | undefined;

        if (asyncPending && seedanceTaskId) {
          // Seedance long-running task: persist task ID, queue poll job,
          // leave generation in "running" state until seedance-poll worker completes it.
          await prisma.generation.update({
            where: { id: generation.id },
            data: {
              status: "running",
              latencyMs: Date.now() - started,
              model: activeModel,
              veoOperationName: seedanceTaskId, // reuse existing column
              costUsd: result.costUsd,
            },
          });
          await enqueueSeedancePoll(generation.id, seedanceTaskId, 1);
          await prisma.contentPlanItem.update({
            where: { id: unit.id },
            data: { status: "generating" },
          });
          return;
        }

        const storedUrl = await persistOutputUrl(generation.id, result.outputUrl);

        await prisma.generation.update({
          where: { id: generation.id },
          data: {
            status: "succeeded",
            outputUrl: storedUrl,
            costUsd: result.costUsd,
            latencyMs: Date.now() - started,
            model: activeModel,
          },
        });

        await enqueueQc(generation.id);
        await prisma.contentPlanItem.update({
          where: { id: unit.id },
          data: { status: "auto_qc" },
        });
        return;
      } catch (err) {
        tries += 1;
        const fallback = fallbackModel(activeModel);
        if (tries >= 3 || !fallback) {
          await prisma.generation.update({
            where: { id: generation.id },
            data: { status: "failed", errorMessage: (err as Error).message },
          });
          await prisma.contentPlanItem.update({
            where: { id: unit.id },
            data: { status: "failed" },
          });
          throw err;
        }
        activeModel = fallback;
      }
    }
  },
  { connection: redis, concurrency: 10 },
);

generationWorker.on("failed", async (job, err) => {
  console.error("[generation] failed", job?.id, err.message);
  // If the job crashes before the inner try/catch (e.g. unit not found in DB),
  // the ContentPlanItem may be stuck in "planned" or "generating". Surface it as failed.
  if (job?.data.unitId) {
    await prisma.contentPlanItem
      .updateMany({
        where: { id: job.data.unitId, status: { in: ["planned", "generating"] } },
        data: { status: "failed" },
      })
      .catch(() => {});
  }
});
