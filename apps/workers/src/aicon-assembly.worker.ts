/**
 * aicon assembly worker
 *
 * Triggered by veo-poll once every approved scene of a project has a videoUrl.
 * Concatenates them via Remotion's AiconStitch composition and uploads the
 * final mp4 to R2, then marks the project `done`.
 */
import fs from "node:fs/promises";
import { Worker } from "bullmq";
import { prisma } from "@wowcut/db";
import { uploadObject } from "@wowcut/storage";
import { redis } from "./redis";
import { renderComposition } from "./remotion-render";

export interface AiconAssemblyJobData {
  projectId: string;
}

export const aiconAssemblyWorker = new Worker<AiconAssemblyJobData>(
  "aicon-assembly",
  async (job) => {
    const { projectId } = job.data;

    const project = await prisma.videoProject.findUnique({
      where: { id: projectId },
      include: {
        scenes: {
          where: { approved: true, videoStatus: "done" },
          orderBy: { index: "asc" },
        },
      },
    });
    if (!project) throw new Error(`Project ${projectId} not found`);
    if (project.scenes.length === 0) {
      throw new Error(`Project ${projectId} has no animated approved scenes`);
    }

    await prisma.videoProject.update({
      where: { id: projectId },
      data: { status: "assembling" },
    });

    const inputProps = {
      scenes: project.scenes.map((s) => ({
        videoUrl: s.videoUrl!,
        durationS: s.durationS,
        caption: s.voiceover ?? undefined,
      })),
    };

    console.log(`[aicon-assembly] rendering ${project.scenes.length} scenes for ${projectId}`);
    const result = await renderComposition({
      compositionId: "AiconStitch",
      inputProps,
      kind: "video",
      outputKey: `aicon/${projectId}/final.mp4`,
    });

    const buffer = await fs.readFile(result.filePath);
    const key = `aicon/${projectId}/final.mp4`;
    const finalVideoUrl = await uploadObject({
      key,
      body: buffer,
      contentType: "video/mp4",
    });

    await prisma.videoProject.update({
      where: { id: projectId },
      data: { finalVideoUrl, status: "done" },
    });

    // Best-effort tmp cleanup
    fs.rm(result.filePath, { force: true }).catch(() => {});

    console.log(`[aicon-assembly] ✓ ${projectId} (${result.durationMs}ms)`);
  },
  {
    connection: redis,
    concurrency: 1,            // Remotion is CPU-heavy — serialise.
    lockDuration: 600_000,     // 10 min
  },
);

aiconAssemblyWorker.on("failed", async (job, err) => {
  if (job) {
    await prisma.videoProject
      .update({ where: { id: job.data.projectId }, data: { status: "failed" } })
      .catch(() => {});
  }
  console.error("[aicon-assembly] failed", job?.id, err.message);
});
