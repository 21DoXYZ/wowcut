import { MODEL_COSTS_USD } from "@wowcut/shared";
import type { GenerationJob, GenerationResult, Provider } from "./index";
import type { GenerationModel } from "../prompts/presets";
import { getVertexImage } from "../vertex/client";
import { VERTEX_MODELS } from "../vertex/models";

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

export async function generateGeminiImage(
  input: GeminiImageCallInput,
): Promise<GeminiImageCallResult> {
  const ai = getVertexImage();
  const started = Date.now();

  const prompt = input.negative
    ? `${input.prompt}\n\nAvoid: ${input.negative}`
    : input.prompt;

  const aspectRatio =
    input.aspectRatio === "9:16" ? "9:16"
    : input.aspectRatio === "16:9" ? "16:9"
    : "1:1";

  const response = await ai.models.generateImages({
    model: VERTEX_MODELS.imageNative,
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio,
      // seed is incompatible with Imagen watermarking (SynthID) — omit
    },
  });

  const img = response.generatedImages?.[0];
  if (!img?.image?.imageBytes) throw new Error("Imagen returned no image");

  return {
    imageBase64: img.image.imageBytes,
    mimeType: "image/png",
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
