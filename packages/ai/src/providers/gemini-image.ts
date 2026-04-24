import { fal } from "@fal-ai/client";
import { MODEL_COSTS_USD } from "@wowcut/shared";
import type { GenerationJob, GenerationResult, Provider } from "./index";
import type { GenerationModel } from "../prompts/presets";

export interface GeminiImageReference {
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  data: string;
}

export interface GeminiImageCallInput {
  model: GenerationModel;
  prompt: string;
  negative?: string;
  references: GeminiImageReference[];
  aspectRatio: string;
  seed?: number;
}

export interface GeminiImageCallResult {
  imageBase64: string;
  mimeType: string;
  latencyMs: number;
  costUsd: number;
  safetyRatings: unknown;
}

const FAL_MODEL_MAP: Record<string, string> = {
  nano_banana_2: "fal-ai/flux/schnell",
  nano_banana_2_hq: "fal-ai/flux/dev",
};

export async function generateGeminiImage(
  input: GeminiImageCallInput,
): Promise<GeminiImageCallResult> {
  const started = Date.now();

  const falModel = FAL_MODEL_MAP[input.model] ?? "fal-ai/flux/schnell";

  fal.config({ credentials: process.env.FAL_API_KEY });

  const result = await fal.subscribe(falModel, {
    input: {
      prompt: input.negative
        ? `${input.prompt} --no ${input.negative}`
        : input.prompt,
      image_size: input.aspectRatio === "9:16" ? "portrait_16_9"
        : input.aspectRatio === "16:9" ? "landscape_16_9"
        : "square_hd",
      num_images: 1,
      ...(input.seed != null ? { seed: input.seed } : {}),
    },
  });

  const output = result.data as { images?: Array<{ url: string; content_type?: string }> };
  const img = output?.images?.[0];
  if (!img?.url) throw new Error("FAL returned no image");

  // Fetch image and convert to base64
  const imgRes = await fetch(img.url);
  const arrayBuffer = await imgRes.arrayBuffer();
  const imageBase64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = (img.content_type ?? imgRes.headers.get("content-type") ?? "image/jpeg") as string;

  return {
    imageBase64,
    mimeType,
    latencyMs: Date.now() - started,
    costUsd: (MODEL_COSTS_USD as Record<string, number>)[input.model] ?? 0.04,
    safetyRatings: [],
  };
}

export class GeminiImageProvider implements Provider {
  supports(model: GenerationModel): boolean {
    return model === "nano_banana_2";
  }

  async generate(job: GenerationJob): Promise<GenerationResult> {
    const started = Date.now();
    const result = await generateGeminiImage({
      model: job.model,
      prompt: job.compiled.prompt,
      negative: job.compiled.negative,
      references: [],
      aspectRatio: job.aspectRatio,
      seed: job.compiled.params.seed as number | undefined,
    });
    const outputUrl = `data:${result.mimeType};base64,${result.imageBase64}`;
    return {
      outputUrl,
      latencyMs: Date.now() - started,
      costUsd: result.costUsd,
      providerMeta: {
        model: job.model,
        mimeType: result.mimeType,
        providerLatencyMs: result.latencyMs,
        safety: result.safetyRatings,
      },
    };
  }
}
