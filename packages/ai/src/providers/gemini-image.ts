import { MODEL_COSTS_USD } from "@wowcut/shared";
import type { GenerationJob, GenerationResult, Provider } from "./index";
import type { GenerationModel } from "../prompts/presets";
import { getVertexImage } from "../vertex/client";
import { VERTEX_MODELS } from "../vertex/models";

export interface GeminiImageCallInput {
  model: GenerationModel;
  prompt: string;
  negative?: string;
  aspectRatio: string;
  productImageBase64?: string;
  productImageMimeType?: string;
}

export interface GeminiImageCallResult {
  imageBase64: string;
  mimeType: string;
  latencyMs: number;
  costUsd: number;
  safetyRatings: unknown;
}

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
 * Imagen 3 path via Vertex AI Express.
 * Uses generateImages (text-to-image). When a product reference image is
 * provided its base64 data is passed as a REFERENCE_TYPE_SUBJECT so Imagen
 * can preserve product details. Falls back to text-only if the SDK rejects it.
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

  // Try subject-reference generation when we have the product image.
  // Falls back to plain text-to-image if the API rejects the referenceImages param.
  const tryWithRef = !!(input.productImageBase64 && input.productImageMimeType);

  const makeRequest = (withRef: boolean) =>
    (ai.models as unknown as {
      generateImages: (opts: unknown) => Promise<{
        generatedImages?: { image?: { imageBytes?: string } }[];
      }>;
    }).generateImages({
      model: VERTEX_MODELS.imageNative,
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio,
        ...(withRef && input.productImageBase64
          ? {
              referenceImages: [
                {
                  referenceType: "REFERENCE_TYPE_SUBJECT",
                  referenceId: 0,
                  referenceImage: { imageBytes: input.productImageBase64 },
                },
              ],
            }
          : {}),
      },
    });

  let response: Awaited<ReturnType<typeof makeRequest>>;
  try {
    response = await makeRequest(tryWithRef);
  } catch {
    if (tryWithRef) {
      response = await makeRequest(false);
    } else {
      throw new Error("Imagen returned no image");
    }
  }

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

    // Extract product image from reference data URLs if available.
    const referenceUrls = job.compiled.referenceImages ?? [];
    const firstRef = referenceUrls[0];
    let productImageBase64: string | undefined;
    let productImageMimeType: string | undefined;
    if (firstRef) {
      const parsed = parseDataUrl(firstRef);
      if (
        parsed &&
        (parsed.mediaType === "image/jpeg" ||
          parsed.mediaType === "image/png" ||
          parsed.mediaType === "image/webp")
      ) {
        productImageBase64 = parsed.data;
        productImageMimeType = parsed.mediaType;
      }
    }

    const result = await generateGeminiImage({
      model: job.model,
      prompt: job.compiled.prompt,
      negative: job.compiled.negative,
      aspectRatio: job.aspectRatio,
      productImageBase64,
      productImageMimeType,
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
