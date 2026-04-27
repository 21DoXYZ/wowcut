/**
 * Seedance poll worker
 *
 * Polls a Seedance 2.0 (BytePlus ModelArk) video generation task until
 * it completes, then uploads the video to R2 and updates the database.
 *
 * Replaces the old veo-poll.worker.ts.
 */
import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@wowcut/shared";
import { prisma } from "@wowcut/db";
import { pollSeedanceJob } from "@wowcut/ai";
import { uploadObject, R2Keys } from "@wowcut/storage";
import { redis } from "./redis";
import { enqueueSeedancePoll, enqueueQc, enqueueAiconAssembly } from "@wowcut/queues";

export interface SeedancePollJobData {
  generationId: string; // for aicon, this is sceneId
  taskId: string;
  attempt: number;
  isAiconScene?: boolean;
}

const MAX_ATTEMPTS = 40; // 40 * ~30s ≈ 20 minutes ceiling

export const seedancePollWorker = new Worker<SeedancePollJobData>(
  QUEUE_NAMES.seedancePoll,
  async (job) => {
    const { generationId, taskId, attempt, isAiconScene } = job.data;

    // ── aicon (video reel) branch ─────────────────────────────────────────────
    if (isAiconScene) {
      const sceneId = generationId;

      if (attempt > MAX_ATTEMPTS) {
        await prisma.videoScene.update({
          where: { id: sceneId },
          data: { videoStatus: "failed" },
        });
        return;
      }

      const result = await pollSeedanceJob(taskId);

      if (!result.done) {
        await prisma.videoScene.update({
          where: { id: sceneId },
          data: { veoPollAttempts: attempt },
        });
        await enqueueSeedancePoll(sceneId, taskId, attempt + 1, { isAiconScene: true });
        return;
      }

      if (result.error || !result.videoUrl) {
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

      // Download video from Seedance URL and re-upload to R2 (60s timeout)
      const abortCtrl = new AbortController();
      const fetchTimeout = setTimeout(() => abortCtrl.abort(), 60_000);
      const videoRes = await fetch(result.videoUrl, { signal: abortCtrl.signal }).finally(() =>
        clearTimeout(fetchTimeout),
      );
      if (!videoRes.ok) throw new Error(`Failed to fetch Seedance video: ${videoRes.status}`);
      const buffer = Buffer.from(await videoRes.arrayBuffer());
      const key = `aicon/${scene.projectId}/scene-${scene.index}.mp4`;
      const url = await uploadObject({ key, body: buffer, contentType: "video/mp4" });

      await prisma.videoScene.update({
        where: { id: sceneId },
        data: { videoUrl: url, videoStatus: "done" },
      });

      // Cost: Seedance 2.0 Pro ≈ $0.50 per output second
      const seconds = Math.min(8, Math.max(4, scene.durationS));
      await prisma.videoProject
        .update({
          where: { id: scene.projectId },
          data: { costUsd: { increment: 0.5 * seconds } },
        })
        .catch(() => {});

      // If every approved scene now has a video → kick assembly
      const remaining = await prisma.videoScene.count({
        where: {
          projectId: scene.projectId,
          approved: true,
          videoStatus: { not: "done" },
        },
      });
      if (remaining === 0) {
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

    // ── wowcut generation branch ──────────────────────────────────────────────
    if (attempt > MAX_ATTEMPTS) {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: "failed",
          errorMessage: `Seedance polling timed out after ${MAX_ATTEMPTS} attempts`,
        },
      });
      return;
    }

    const result = await pollSeedanceJob(taskId);

    if (!result.done) {
      await prisma.generation.update({
        where: { id: generationId },
        data: { veoPollAttempts: attempt },
      });
      await enqueueSeedancePoll(generationId, taskId, attempt + 1);
      return;
    }

    if (result.error || !result.videoUrl) {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: "failed",
          errorMessage: result.error ?? "Seedance returned no video URL",
        },
      });
      return;
    }

    // Download from Seedance CDN and upload to R2 (60s timeout)
    const abortCtrl2 = new AbortController();
    const fetchTimeout2 = setTimeout(() => abortCtrl2.abort(), 60_000);
    const videoRes = await fetch(result.videoUrl, { signal: abortCtrl2.signal }).finally(() =>
      clearTimeout(fetchTimeout2),
    );
    if (!videoRes.ok) throw new Error(`Failed to fetch Seedance video: ${videoRes.status}`);
    const buffer = Buffer.from(await videoRes.arrayBuffer());
    const key = R2Keys.generation(generationId, "mp4");
    const url = await uploadObject({ key, body: buffer, contentType: "video/mp4" });

    await prisma.generation.update({
      where: { id: generationId },
      data: { status: "succeeded", outputUrl: url },
    });

    await enqueueQc(generationId);
  },
  { connection: redis, concurrency: 5 },
);

seedancePollWorker.on("failed", (job, err) =>
  console.error("[seedance-poll] failed", job?.id, err.message),
);
