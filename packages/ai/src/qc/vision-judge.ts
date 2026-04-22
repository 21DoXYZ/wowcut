import { z } from "zod";
import { generateStructured, VERTEX_MODELS, type VertexImagePart } from "../vertex";

export interface VisionJudgeInput {
  imageBase64: string;
  imageMediaType: "image/jpeg" | "image/png" | "image/webp";
  prompt: string;
  stylePreset: string;
  productImageBase64?: string;
  productImageMediaType?: "image/jpeg" | "image/png" | "image/webp";
}

const VisionJudgeSchema = z.object({
  promptFidelity: z.number().min(0).max(1),
  composition: z.number().min(0).max(100),
  aesthetic: z.number().min(0).max(10),
  faceCount: z.number().int().min(0).max(20),
  productIdentityDelta: z.enum(["preserved", "partial", "broken"]),
  reasoning: z.string().max(400),
});

const RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  required: [
    "promptFidelity",
    "composition",
    "aesthetic",
    "faceCount",
    "productIdentityDelta",
    "reasoning",
  ],
  properties: {
    promptFidelity: { type: "number", minimum: 0, maximum: 1 },
    composition: { type: "number", minimum: 0, maximum: 100 },
    aesthetic: { type: "number", minimum: 0, maximum: 10 },
    faceCount: { type: "integer", minimum: 0 },
    productIdentityDelta: {
      type: "string",
      enum: ["preserved", "partial", "broken"],
    },
    reasoning: { type: "string" },
  },
};

const SYSTEM = `You are a senior photography reviewer evaluating AI-generated commercial images.

You receive a generated image and its source prompt. Optionally a second "Original product" image — compare product identity against it.

Produce five strict JSON scores. Be harsh — averages should cluster around 0.5 promptFidelity and 60 composition.

- promptFidelity (0.00 to 1.00): does the image depict what the prompt says? Penalize missing elements, wrong surface, wrong lighting, wrong angle.
- composition (0 to 100): commercial composition quality. Consider product dominance, background cleanliness, rule of thirds or intentional centering, lighting direction, visual balance. 85+ means publishable catalog quality.
- aesthetic (0 to 10): LAION-style raw aesthetic quality. 7+ means beautiful.
- faceCount: exact number of human faces visible, even partial.
- productIdentityDelta: "preserved" = same product, "partial" = similar but distorted shape/label/color, "broken" = different product entirely. Only set if an "Original product" image is provided, else "preserved".

Return JSON only, match schema exactly.`;

export interface VisionJudgeResult {
  promptFidelity: number;
  composition: number;
  aesthetic: number;
  faceCount: number;
  productIdentityDelta: "preserved" | "partial" | "broken";
  reasoning: string;
}

export async function judgeWithVision(input: VisionJudgeInput): Promise<VisionJudgeResult> {
  const images: VertexImagePart[] = [
    {
      mediaType: input.imageMediaType,
      base64: input.imageBase64,
      label: "Generated",
    },
  ];
  if (input.productImageBase64) {
    images.push({
      mediaType: input.productImageMediaType ?? "image/jpeg",
      base64: input.productImageBase64,
      label: "Original product",
    });
  }

  const userText = `Prompt used:\n${input.prompt}\n\nStyle preset: ${input.stylePreset}\n\nReturn JSON only.`;

  try {
    const result = await generateStructured({
      model: VERTEX_MODELS.vision,
      system: SYSTEM,
      userText,
      images,
      schema: VisionJudgeSchema,
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 600,
      temperature: 0.15,
    });
    return result.data;
  } catch {
    return {
      promptFidelity: 0.5,
      composition: 60,
      aesthetic: 5.5,
      faceCount: 0,
      productIdentityDelta: "preserved",
      reasoning: "vision_judge_failed",
    };
  }
}
