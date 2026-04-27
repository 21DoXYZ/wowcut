/**
 * aicon animate worker
 *
 * After user approves a scene, this worker:
 *   1. Takes the approved keyframe image
 *   2. Sends it to Seedance 2.0 (BytePlus ModelArk) image-to-video
 *   3. Queues seedance-poll to track completion
 *   4. On completion: videoUrl saved → if all scenes animated → trigger assembly
 */
import { Worker } from "bullmq";
import { prisma } from "@wowcut/db";
import { startSeedanceJob } from "@wowcut/ai";
import { redis } from "./redis";
import { enqueueSeedancePoll } from "@wowcut/queues";

export interface AiconAnimateJobData {
  sceneId: string;
}

export const aiconAnimateWorker = new Worker<AiconAnimateJobData>(
  "aicon-animate",
  async (job) => {
    const scene = await prisma.videoScene.findUnique({
      where: { id: job.data.sceneId },
      include: { project: true },
    });
    if (!scene) throw new Error(`Scene ${job.data.sceneId} not found`);
    if (!scene.imageUrl) throw new Error(`Scene ${scene.id} has no keyframe image`);
    if (!scene.approved) throw new Error(`Scene ${scene.id} not approved`);

    await prisma.videoScene.update({
      where: { id: scene.id },
      data: { videoStatus: "generating" },
    });

    const videoPrompt = scene.imagePrompt
      ? `${scene.imagePrompt}. Smooth cinematic motion, satisfying and beautiful.`
      : `${scene.action}. Smooth cinematic motion, satisfying and beautiful.`;

    // Seedance 2.0 image-to-video — pass the keyframe URL directly (no base64 needed)
    const op = await startSeedanceJob({
      model: "seedance-2.0-pro",
      prompt: videoPrompt,
      aspectRatio: "9:16",
      durationSeconds: Math.min(8, Math.max(4, scene.durationS)),
      imageUrl: scene.imageUrl,
    });

    await prisma.videoScene.update({
      where: { id: scene.id },
      data: { veoOperationName: op.taskId },
    });

    await enqueueSeedancePoll(scene.id, op.taskId, 1, { isAiconScene: true });

    console.log(`[aicon-animate] ✓ Seedance started for scene ${scene.index}`);
  },
  {
    connection: redis,
    concurrency: 2,
    lockDuration: 60_000,
  },
);

aiconAnimateWorker.on("failed", async (job, err) => {
  if (job) {
    await prisma.videoScene
      .update({ where: { id: job.data.sceneId }, data: { videoStatus: "failed" } })
      .catch(() => {});
  }
  console.error("[aicon-animate] failed", job?.id, err.message);
});
