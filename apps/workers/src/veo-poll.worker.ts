import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@wowcut/shared";
import { prisma } from "@wowcut/db";
import { pollVeoJob } from "@wowcut/ai";
import { uploadObject, R2Keys } from "@wowcut/storage";
import { redis } from "./redis";
import { enqueueVeoPoll, enqueueQc } from "@wowcut/queues";

export interface VeoPollJobData {
  generationId: string;
  operationName: string;
  attempt: number;
}

const MAX_ATTEMPTS = 30; // 30 * ~30s ≈ 15 minutes ceiling

export const veoPollWorker = new Worker<VeoPollJobData>(
  QUEUE_NAMES.veoPoll,
  async (job) => {
    const { generationId, operationName, attempt } = job.data;

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

    // Upload video to R2
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

    // Kick QC for the completed video
    await enqueueQc(generationId);
  },
  { connection: redis, concurrency: 5 },
);

veoPollWorker.on("failed", (job, err) =>
  console.error("[veo-poll] failed", job?.id, err.message),
);
