import { MODEL_COSTS_USD } from "@wowcut/shared";
import type { GenerationJob, GenerationResult, Provider } from "./index";
import type { GenerationModel } from "../prompts/presets";
import { getVertex } from "../vertex/client";
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
  const ai = getVertex();
  const started = Date.now();

  const parts: Array<Record<string, unknown>> = [];
  for (const ref of input.references) {
    parts.push({ inlineData: { mimeType: ref.mediaType, data: ref.data } });
  }
  const instruction = input.negative
    ? `${input.prompt}\n\nAvoid: ${input.negative}`
    : input.prompt;
  parts.push({ text: instruction });

  const response = await ai.models.generateContent({
    model: VERTEX_MODELS.imageNative,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["IMAGE"],
      temperature: 0.85,
      ...(input.seed != null ? { seed: input.seed } : {}),
    },
  });

  const candidate = response.candidates?.[0];
  if (!candidate) {
    throw new Error("Gemini image model returned no candidate");
  }
  const imagePart = candidate.content?.parts?.find(
    (p): p is { inlineData: { data: string; mimeType?: string } } =>
      typeof (p as { inlineData?: unknown }).inlineData !== "undefined",
  );
  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini image model returned no image");
  }

  return {
    imageBase64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType ?? "image/jpeg",
    latencyMs: Date.now() - started,
    costUsd: (MODEL_COSTS_USD as Record<string, number>)[input.model] ?? 0.04,
    safetyRatings: candidate.safetyRatings ?? [],
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
