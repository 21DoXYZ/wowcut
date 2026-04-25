import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@wowcut/shared";
import { prisma } from "@wowcut/db";
import { pollVeoJob } from "@wowcut/ai";
import { uploadObject, R2Keys } from "@wowcut/storage";
import { redis } from "./redis";
import { enqueueVeoPoll, enqueueQc, enqueueAiconAssembly } from "@wowcut/queues";

export interface VeoPollJobData {
  generationId: string;       // for aicon, this is sceneId
  operationName: string;
  attempt: number;
  isAiconScene?: boolean;
}

const MAX_ATTEMPTS = 30; // 30 * ~30s ≈ 15 minutes ceiling

export const veoPollWorker = new Worker<VeoPollJobData>(
  QUEUE_NAMES.veoPoll,
  async (job) => {
    const { generationId, operationName, attempt, isAiconScene } = job.data;

    // ── aicon branch ────────────────────────────────────────────────────────
    if (isAiconScene) {
      const sceneId = generationId;

      if (attempt > MAX_ATTEMPTS) {
        await prisma.videoScene.update({
          where: { id: sceneId },
          data: { videoStatus: "failed" },
        });
        return;
      }

      const result = await pollVeoJob(operationName);
      if (!result.done) {
        await prisma.videoScene.update({
          where: { id: sceneId },
          data: { veoPollAttempts: attempt },
        });
        await enqueueVeoPoll(sceneId, operationName, attempt + 1, { isAiconScene: true });
        return;
      }

      if (result.error || !result.videoBase64) {
        await prisma.videoScene.update({
          where: { id: sceneId },
          data: { videoStatus: "failed" },
        });
        return;
      }

      const scene = await prisma.videoScene.findUnique({
        where: { id: sceneId },
        select: { projectId: true, index: true, durationS: true },
      });
      if (!scene) return;

      const ext = (result.mimeType ?? "video/mp4").includes("webm") ? "webm" : "mp4";
      const buffer = Buffer.from(result.videoBase64, "base64");
      const key = `aicon/${scene.projectId}/scene-${scene.index}.${ext}`;
      const url = await uploadObject({
        key,
        body: buffer,
        contentType: result.mimeType ?? "video/mp4",
      });

      await prisma.videoScene.update({
        where: { id: sceneId },
        data: { videoUrl: url, videoStatus: "done" },
      });

      // Cost: Veo 2 ≈ $0.35 per output second (clamped 4–8s by aicon-animate).
      const seconds = Math.min(8, Math.max(4, scene.durationS));
      await prisma.videoProject
        .update({
          where: { id: scene.projectId },
          data: { costUsd: { increment: 0.35 * seconds } },
        })
        .catch(() => {});

      // If every approved scene now has a video → kick assembly.
      const remaining = await prisma.videoScene.count({
        where: {
          projectId: scene.projectId,
          approved: true,
          videoStatus: { not: "done" },
        },
      });
      if (remaining === 0) {
        // Idempotent: only flip + enqueue if not already past this stage.
        // updateMany returns count so concurrent pollers don't double-enqueue.
        const flipped = await prisma.videoProject.updateMany({
          where: { id: scene.projectId, status: { in: ["animating"] } },
          data: { status: "assembling" },
        });
        if (flipped.count > 0) {
          await enqueueAiconAssembly(scene.projectId);
        }
      }
      return;
    }

    // ── wowcut (legacy) branch ──────────────────────────────────────────────
    if (attempt > MAX_ATTEMPTS) {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: "failed",
          errorMessage: `Veo polling timed out after ${MAX_ATTEMPTS} attempts`,
        },
      });
      return;
    }

    const result = await pollVeoJob(operationName);

    if (!result.done) {
      await prisma.generation.update({
        where: { id: generationId },
        data: { veoPollAttempts: attempt },
      });
      await enqueueVeoPoll(generationId, operationName, attempt + 1);
      return;
    }

    if (result.error || !result.videoBase64) {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: "failed",
          errorMessage: result.error ?? "Veo returned no video",
        },
      });
      return;
    }

    const ext = (result.mimeType ?? "video/mp4").includes("webm") ? "webm" : "mp4";
    const buffer = Buffer.from(result.videoBase64, "base64");
    const key = R2Keys.generation(generationId, ext as "mp4");
    const url = await uploadObject({
      key,
      body: buffer,
      contentType: result.mimeType ?? "video/mp4",
    });

    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: "succeeded",
        outputUrl: url,
      },
    });

    await enqueueQc(generationId);
  },
  { connection: redis, concurrency: 5 },
);

veoPollWorker.on("failed", (job, err) =>
  console.error("[veo-poll] failed", job?.id, err.message),
);
