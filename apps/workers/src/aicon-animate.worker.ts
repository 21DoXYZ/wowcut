/**
 * aicon animate worker
 *
 * After user approves a scene, this worker:
 *   1. Takes the approved keyframe image
 *   2. Sends it to Veo (image-to-video) via startVeoJob
 *   3. Queues veo-poll to track completion
 *   4. On completion: videoUrl saved → if all scenes animated → trigger assembly
 */
import { Worker } from "bullmq";
import { prisma } from "@wowcut/db";
import { startVeoJob } from "@wowcut/ai";
import { redis } from "./redis";
import { Queue } from "bullmq";

const veoPollQueue = new Queue("veo-poll", { connection: redis });

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

    // Fetch keyframe as base64 for Veo image-to-video
    const res = await fetch(scene.imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch keyframe: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const imageBase64 = buffer.toString("base64");
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const imageMimeType = contentType.includes("png") ? "image/png" : "image/jpeg";

    const videoPrompt = scene.imagePrompt
      ? `${scene.imagePrompt}. Smooth cinematic motion, satisfying and beautiful.`
      : `${scene.action}. Smooth cinematic motion, satisfying and beautiful.`;

    const op = await startVeoJob({
      model: "veo_2", // veo_2 is cheaper; switch to veo_3 for premium quality
      prompt: videoPrompt,
      aspectRatio: "9:16",
      durationSeconds: Math.min(8, Math.max(4, scene.durationS)) as 4 | 5 | 6 | 7 | 8,
      imageBase64,
      imageMimeType: imageMimeType as "image/jpeg" | "image/png",
    });

    await prisma.videoScene.update({
      where: { id: scene.id },
      data: { veoOperationName: op.operationName },
    });

    // Queue veo polling — reuses existing veo-poll worker
    // We use sceneId as the generationId equivalent (custom handling via metadata)
    await veoPollQueue.add(
      `aicon-veo-${scene.id}`,
      {
        generationId: scene.id,   // we'll intercept this in poll worker
        operationName: op.operationName,
        attempt: 1,
        isAiconScene: true,       // flag so veo-poll worker routes correctly
      },
      { delay: 15_000, attempts: 1, removeOnComplete: true },
    );

    console.log(`[aicon-animate] ✓ Veo started for scene ${scene.index}`);
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
