/**
 * aicon bootstrap worker
 *
 * Heavy work that used to run synchronously inside the create mutation:
 *   1. (optional) scrape reference URL via Apify
 *   2. (optional) analyse reference video via Gemini 2.5 Pro
 *   3. generate script via Gemini Flash
 *   4. generate per-scene storyboard visuals via Gemini Flash Lite
 *   5. write VideoScene rows + queue per-scene image generation
 *
 * Triggered when the API creates a `draft` VideoProject.
 *
 * Soft-fail rules: if reference scraping or analysis fails the project still
 * proceeds (without reference). If script generation fails the project is
 * marked `failed` so the UI surfaces the error.
 */
import { Worker } from "bullmq";
import { prisma } from "@wowcut/db";
import {
  generateVideoScript,
  generateAllSceneVisuals,
  scrapeReference,
  analyzeReferenceVideo,
  type ReferenceAnalysis,
  type ScrapedReference,
} from "@wowcut/ai";
import { redis } from "./redis";
import { enqueueAiconScene } from "@wowcut/queues";

export interface AiconBootstrapJobData {
  projectId: string;
}

// Limit how much of the raw Apify payload we persist — full Instagram dumps
// can be 50KB+ and contain hashtag/owner data we never use.
function trimReferenceData(ref: ScrapedReference) {
  return {
    platform: ref.platform,
    url: ref.url,
    videoUrl: ref.videoUrl,
    thumbnailUrl: ref.thumbnailUrl,
    caption: ref.caption?.slice(0, 1000) ?? null,
    author: ref.author,
    durationSec: ref.durationSec,
    viewCount: ref.viewCount,
    likeCount: ref.likeCount,
  };
}

export const aiconBootstrapWorker = new Worker<AiconBootstrapJobData>(
  "aicon-bootstrap",
  async (job) => {
    const { projectId } = job.data;
    const project = await prisma.videoProject.findUnique({ where: { id: projectId } });
    if (!project) throw new Error(`Project ${projectId} not found`);

    // 1+2. Optional reference processing (soft-fail).
    let referenceAnalysis: ReferenceAnalysis | null = null;
    let referenceFailed = false;
    if (project.referenceUrl) {
      try {
        const scraped = await scrapeReference(project.referenceUrl);
        referenceAnalysis = await analyzeReferenceVideo(scraped);
        await prisma.videoProject.update({
          where: { id: projectId },
          data: {
            referenceData: trimReferenceData(scraped) as unknown as object,
            referenceAnalysis: referenceAnalysis as unknown as object,
          },
        });
        console.log(`[aicon-bootstrap] reference processed for ${projectId}`);
      } catch (err) {
        referenceFailed = true;
        console.error(`[aicon-bootstrap] reference failed for ${projectId}:`, err);
        // Persist nothing — the UI will see referenceUrl set but no analysis.
      }
    }

    // 3. Script.
    const duration = project.duration as "s15" | "s30" | "s60";
    const script = await generateVideoScript(project.topic, duration, referenceAnalysis);

    // 4. Per-scene visuals (parallel inside generateAllSceneVisuals).
    const visuals = await generateAllSceneVisuals(project.topic, script.scenes);

    // 5. Persist scenes + flip status to "generating".
    await prisma.videoProject.update({
      where: { id: projectId },
      data: {
        status: "generating",
        script: script as unknown as object,
        scenes: {
          create: script.scenes.map((scene, i) => ({
            index: scene.index,
            title: scene.title,
            action: scene.action,
            voiceover: scene.voiceover,
            durationS: scene.durationS,
            shotType: visuals[i]?.shotType,
            visualDescription: visuals[i]?.visualDescription,
            imagePrompt: visuals[i]?.imagePrompt,
            negativePrompt: visuals[i]?.negativePrompt,
            imageStatus: "pending",
          })),
        },
      },
    });

    // 6. Queue keyframe generation for every scene.
    const scenes = await prisma.videoScene.findMany({
      where: { projectId },
      select: { id: true },
    });
    for (const s of scenes) {
      await enqueueAiconScene(s.id);
    }

    if (referenceFailed) {
      console.log(`[aicon-bootstrap] ${projectId} bootstrapped without reference`);
    } else {
      console.log(`[aicon-bootstrap] ✓ ${projectId} (${scenes.length} scenes)`);
    }
  },
  {
    connection: redis,
    concurrency: 2,           // bootstrap is bursty + uses Gemini quota
    lockDuration: 300_000,    // 5 min ceiling — covers worst-case Apify+video analysis
  },
);

aiconBootstrapWorker.on("failed", async (job, err) => {
  if (job) {
    await prisma.videoProject
      .update({ where: { id: job.data.projectId }, data: { status: "failed" } })
      .catch(() => {});
  }
  console.error("[aicon-bootstrap] failed", job?.id, err.message);
});
