import { MODEL_COSTS_USD } from "@wowcut/shared";
import type { GenerationJob, GenerationResult, Provider } from "./index";
import type { GenerationModel } from "../prompts/presets";
import { getVertex, getVertexImage } from "../vertex/client";
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

// Gemini model that supports image generation with image references via generateContent.
const GEMINI_IMAGE_GEN_MODEL = "gemini-2.0-flash-preview-image-generation";

/**
 * Parse a data URL (data:image/jpeg;base64,XXXX) into its parts.
 * Returns null if the string is not a data URL.
 */
function parseDataUrl(s: string): { mediaType: string; data: string } | null {
  if (!s.startsWith("data:")) return null;
  const [meta, data] = s.split(";base64,");
  if (!meta || !data) return null;
  return { mediaType: meta.replace("data:", ""), data };
}

/**
 * Gemini generateContent path: pass the product image as a visual reference.
 * The model sees the actual product and generates a scene around it.
 */
async function generateWithReference(
  prompt: string,
  reference: GeminiImageReference,
): Promise<GeminiImageCallResult> {
  const ai = getVertex();
  const started = Date.now();

  const fullPrompt =
    "You are a professional product photographer. Generate a high-quality commercial product photography scene. " +
    "The product shown in the reference image MUST appear as the primary subject — render it faithfully, preserving its exact shape, color, material, and details. " +
    "Do NOT substitute with a different product.\n\n" +
    prompt;

  const response = await ai.models.generateContent({
    model: GEMINI_IMAGE_GEN_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: reference.mediaType, data: reference.data } },
          { text: fullPrompt },
        ],
      },
    ],
    config: {
      responseModalities: ["IMAGE"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) throw new Error("Gemini returned no image");

  return {
    imageBase64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType ?? "image/png",
    latencyMs: Date.now() - started,
    costUsd: 0.04,
    safetyRatings: [],
  };
}

/**
 * Text-only Imagen path: used when no reference image is available.
 */
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

    const referenceUrls = job.compiled.referenceImages ?? [];
    const firstRef = referenceUrls[0];

    let result: GeminiImageCallResult;

    if (firstRef) {
      // Try to parse as data URL first (preview worker passes base64 data URLs).
      // Fall back to text-only Imagen if parsing fails.
      const parsed = parseDataUrl(firstRef);
      if (parsed && (parsed.mediaType === "image/jpeg" || parsed.mediaType === "image/png" || parsed.mediaType === "image/webp")) {
        result = await generateWithReference(job.compiled.prompt, {
          mediaType: parsed.mediaType as "image/jpeg" | "image/png" | "image/webp",
          data: parsed.data,
        });
      } else {
        result = await generateGeminiImage({
          model: job.model,
          prompt: job.compiled.prompt,
          negative: job.compiled.negative,
          references: [],
          aspectRatio: job.aspectRatio,
          seed: job.compiled.params.seed as number | undefined,
        });
      }
    } else {
      result = await generateGeminiImage({
        model: job.model,
        prompt: job.compiled.prompt,
        negative: job.compiled.negative,
        references: [],
        aspectRatio: job.aspectRatio,
        seed: job.compiled.params.seed as number | undefined,
      });
    }

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
