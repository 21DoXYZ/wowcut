import { MODEL_COSTS_USD } from "@wowcut/shared";
import type { GenerationJob, GenerationResult, Provider } from "./index";
import type { GenerationModel } from "../prompts/presets";
import { getVertex } from "../vertex/client";
import { VERTEX_MODELS } from "../vertex/models";

export interface VeoStartInput {
  model: "veo_3" | "veo_2";
  prompt: string;
  aspectRatio: string;
  durationSeconds?: 4 | 5 | 6 | 7 | 8;
  imageBase64?: string;
  imageMimeType?: "image/jpeg" | "image/png" | "image/webp";
}

export interface VeoOperation {
  operationName: string;
  modelId: string;
  startedAt: string;
}

export interface VeoPollResult {
  done: boolean;
  videoBase64?: string;
  mimeType?: string;
  costUsd?: number;
  error?: string;
}

export async function startVeoJob(input: VeoStartInput): Promise<VeoOperation> {
  const ai = getVertex();
  const modelId = input.model === "veo_3" ? VERTEX_MODELS.veo3 : VERTEX_MODELS.veo2;

  const generateVideos = (ai.models as unknown as {
    generateVideos?: (args: Record<string, unknown>) => Promise<{ name?: string }>;
  }).generateVideos;

  if (!generateVideos) {
    throw new Error("generateVideos not available on Vertex client");
  }

  const config: Record<string, unknown> = {
    aspectRatio: input.aspectRatio === "9:16" ? "9:16" : "16:9",
    numberOfVideos: 1,
    durationSeconds: input.durationSeconds ?? 6,
    personGeneration: "allow_adult",
  };

  const args: Record<string, unknown> = {
    model: modelId,
    prompt: input.prompt,
    config,
  };

  if (input.imageBase64) {
    args.image = {
      imageBytes: input.imageBase64,
      mimeType: input.imageMimeType ?? "image/jpeg",
    };
  }

  const op = await generateVideos(args);
  if (!op.name) {
    throw new Error("Veo did not return an operation name");
  }
  return {
    operationName: op.name,
    modelId,
    startedAt: new Date().toISOString(),
  };
}

export async function pollVeoJob(operationName: string): Promise<VeoPollResult> {
  const ai = getVertex();
  const fetchOp = (ai.operations as unknown as {
    getVideosOperation?: (args: { operation: { name: string } }) => Promise<{
      done?: boolean;
      error?: { message?: string };
      response?: { videos?: Array<{ video?: { videoBytes?: string; mimeType?: string } }> };
    }>;
  }).getVideosOperation;

  if (!fetchOp) {
    throw new Error("getVideosOperation not available on Vertex client");
  }

  const op = await fetchOp({ operation: { name: operationName } });

  if (!op.done) return { done: false };
  if (op.error) return { done: true, error: op.error.message ?? "unknown_error" };

  const video = op.response?.videos?.[0]?.video;
  if (!video?.videoBytes) {
    return { done: true, error: "Veo operation done but returned no video bytes" };
  }

  return {
    done: true,
    videoBase64: video.videoBytes,
    mimeType: video.mimeType ?? "video/mp4",
  };
}

export class VeoProvider implements Provider {
  supports(model: GenerationModel): boolean {
    return model === "kling_v2" || model === "seedance_v2_pro" || model === "runway_gen3";
  }

  async generate(job: GenerationJob): Promise<GenerationResult> {
    // NOTE: Synchronous generate() is NOT the right pattern for Veo because
    // generations take 30-120s. Workers should use startVeoJob + pollVeoJob
    // separately via the veo_poll BullMQ queue.
    //
    // This method exists only for protocol compatibility — it starts the job
    // and returns an operation reference. The generation.worker should detect
    // provider === Veo and branch into the async flow.
    const started = Date.now();
    const op = await startVeoJob({
      model: "veo_3",
      prompt: job.compiled.prompt,
      aspectRatio: job.aspectRatio,
    });

    const estimatedSeconds = 6;
    const costUsd = (MODEL_COSTS_USD.kling_v2 ?? 0.75) * estimatedSeconds;

    return {
      outputUrl: "", // placeholder — filled after polling
      latencyMs: Date.now() - started,
      costUsd,
      providerMeta: {
        veoOperationName: op.operationName,
        veoModelId: op.modelId,
        asyncPending: true,
      },
    };
  }
}
