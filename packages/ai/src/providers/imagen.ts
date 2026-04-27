import type { GenerationJob, GenerationResult, Provider } from "./index";
import type { GenerationModel } from "../prompts/presets";
import { getVertexImage } from "../vertex/client";
import { VERTEX_MODELS } from "../vertex/models";

export interface ImagenCallInput {
  model: "imagen_3" | "imagen_3_fast";
  prompt: string;
  negative?: string;
  aspectRatio: string;
  seed?: number;
  count?: number;
}

export interface ImagenCallResult {
  imageBase64: string;
  mimeType: string;
  latencyMs: number;
  costUsd: number;
}

const ASPECT_MAP: Record<string, string> = {
  "1:1": "1:1",
  "9:16": "9:16",
  "4:5": "4:5",
  "16:9": "16:9",
  "3:4": "3:4",
};

const IMAGEN_COSTS: Record<"imagen_3" | "imagen_3_fast", number> = {
  imagen_3: 0.06,
  imagen_3_fast: 0.02,
};

export async function generateImagen(input: ImagenCallInput): Promise<ImagenCallResult> {
  const ai = getVertexImage();
  const started = Date.now();

  const modelId =
    input.model === "imagen_3" ? VERTEX_MODELS.imagenHQ : VERTEX_MODELS.imagenFast;

  const config: Record<string, unknown> = {
    numberOfImages: input.count ?? 1,
    aspectRatio: ASPECT_MAP[input.aspectRatio] ?? "1:1",
    negativePrompt: input.negative,
    safetyFilterLevel: "BLOCK_ONLY_HIGH",
    personGeneration: "ALLOW_ADULT",
    addWatermark: false,
  };
  if (input.seed != null) config.seed = input.seed;

  const response = await ai.models.generateImages({
    model: modelId,
    prompt: input.prompt,
    config: config as never,
  });

  const first = response.generatedImages?.[0];
  const bytes = first?.image?.imageBytes;
  if (!bytes) {
    throw new Error("Imagen returned no image");
  }

  return {
    imageBase64: bytes,
    mimeType: first?.image?.mimeType ?? "image/png",
    latencyMs: Date.now() - started,
    costUsd: IMAGEN_COSTS[input.model],
  };
}

export class ImagenProvider implements Provider {
  supports(model: GenerationModel): boolean {
    return model === "nano_banana_2_hq" || model === "flux_pro";
  }

  async generate(job: GenerationJob): Promise<GenerationResult> {
    const started = Date.now();
    const chosen: "imagen_3" | "imagen_3_fast" =
      job.model === "nano_banana_2_hq" ? "imagen_3" : "imagen_3_fast";
    const result = await generateImagen({
      model: chosen,
      prompt: job.compiled.prompt,
      negative: job.compiled.negative,
      aspectRatio: job.aspectRatio,
      seed: job.compiled.params.seed as number | undefined,
    });
    const outputUrl = `data:${result.mimeType};base64,${result.imageBase64}`;
    return {
      outputUrl,
      latencyMs: Date.now() - started,
      costUsd: result.costUsd,
      providerMeta: {
        model: chosen,
        mimeType: result.mimeType,
        providerLatencyMs: result.latencyMs,
      },
    };
  }
}
