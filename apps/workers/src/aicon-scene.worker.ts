/**
 * aicon scene worker
 *
 * Processes a single VideoScene:
 *   1. Generate keyframe image via Imagen 3 (routeProvider)
 *   2. Upload to R2
 *   3. Update scene.imageUrl + imageStatus = "done"
 *
 * Animation (Veo) is triggered separately via aicon-animate.worker.ts
 * after user approves scenes.
 */
import { Worker } from "bullmq";
import { prisma } from "@wowcut/db";
import { routeProvider } from "@wowcut/ai";
import { uploadObject } from "@wowcut/storage";
import { redis } from "./redis";

export interface AiconSceneJobData {
  sceneId: string;
}

const IMAGE_MODEL = "nano_banana_2" as const;

function parseDataUrl(dataUrl: string): { base64: string; mimeType: string } {
  const [meta, base64] = dataUrl.split(";base64,");
  return {
    base64: base64 ?? "",
    mimeType: (meta ?? "data:image/png").replace("data:", ""),
  };
}

export const aiconSceneWorker = new Worker<AiconSceneJobData>(
  "aicon-scene",
  async (job) => {
    const scene = await prisma.videoScene.findUnique({
      where: { id: job.data.sceneId },
      include: { project: true },
    });
    if (!scene) throw new Error(`Scene ${job.data.sceneId} not found`);
    if (!scene.imagePrompt) throw new Error(`Scene ${scene.id} has no imagePrompt`);

    await prisma.videoScene.update({
      where: { id: scene.id },
      data: { imageStatus: "generating" },
    });

    const provider = routeProvider(IMAGE_MODEL);
    const genResult = await provider.generate({
      model: IMAGE_MODEL,
      compiled: {
        prompt: scene.imagePrompt,
        negative: scene.negativePrompt ?? "blurry, low quality, text, watermark, cartoon, anime",
        params: {},
        referenceImages: [],
      },
      format: "static",
      aspectRatio: "9:16",
    });

    const { base64, mimeType } = parseDataUrl(genResult.outputUrl);
    const key = `aicon/${scene.projectId}/scene-${scene.index}.jpg`;
    const buffer = Buffer.from(base64, "base64");
    const imageUrl = await uploadObject({ key, body: buffer, contentType: mimeType });

    await prisma.videoScene.update({
      where: { id: scene.id },
      data: { imageUrl, imageStatus: "done" },
    });

    // Cost: nano_banana_2 / Imagen-3 Fast ≈ $0.039 per image.
    await prisma.videoProject
      .update({
        where: { id: scene.projectId },
        data: { costUsd: { increment: 0.039 } },
      })
      .catch(() => {});

    // Check if all scenes in project are done → update project status
    const project = scene.project;
    const allScenes = await prisma.videoScene.findMany({
      where: { projectId: project.id },
      select: { imageStatus: true },
    });
    const allDone = allScenes.every((s) => s.imageStatus === "done");
    if (allDone) {
      // Idempotent flip — concurrent scene workers all see allDone, but only
      // the first one wins the updateMany (status moves from "generating").
      const flipped = await prisma.videoProject.updateMany({
        where: { id: project.id, status: "generating" },
        data: { status: "reviewing" },
      });
      if (flipped.count > 0) {
        console.log(`[aicon] project ${project.id} ready for review`);
      }
    }

    console.log(`[aicon-scene] ✓ scene ${scene.index} of project ${project.id}`);
  },
  {
    connection: redis,
    concurrency: 4,
    lockDuration: 120_000,
  },
);

aiconSceneWorker.on("failed", async (job, err) => {
  if (job) {
    await prisma.videoScene
      .update({
        where: { id: job.data.sceneId },
        data: { imageStatus: "failed" },
      })
      .catch(() => {});
  }
  console.error("[aicon-scene] failed", job?.id, err.message);
});
