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
import { redis } from "./redis";
import { qcQueue, enqueueVeoPoll } from "./queues";

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
        const veoOpName = result.providerMeta.veoOperationName as string | undefined;

        if (asyncPending && veoOpName) {
          // Veo long-running operation: persist operation name, queue poll job,
          // leave generation in "running" state until veo-poll worker completes it.
          await prisma.generation.update({
            where: { id: generation.id },
            data: {
              status: "running",
              latencyMs: Date.now() - started,
              model: activeModel,
              veoOperationName: veoOpName,
              costUsd: result.costUsd,
            },
          });
          await enqueueVeoPoll(generation.id, veoOpName, 1);
          await prisma.contentPlanItem.update({
            where: { id: unit.id },
            data: { status: "generating" },
          });
          return;
        }

        await prisma.generation.update({
          where: { id: generation.id },
          data: {
            status: "succeeded",
            outputUrl: result.outputUrl,
            costUsd: result.costUsd,
            latencyMs: Date.now() - started,
            model: activeModel,
          },
        });

        await qcQueue.add("qc", { generationId: generation.id }, { attempts: 2 });
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

generationWorker.on("failed", (job, err) => {
  console.error("[generation] failed", job?.id, err.message);
});
