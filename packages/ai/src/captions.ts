import { z } from "zod";
import { generateStructured, generateText, VERTEX_MODELS } from "./vertex";

export interface CaptionInput {
  brandName: string;
  productName: string;
  stylePreset: string;
  toneOfVoice: string;
  channel: string;
}

export interface CaptionOutput {
  caption: string;
  hashtags: string[];
}

const CaptionSchema = z.object({
  caption: z.string().max(300),
  hashtags: z.array(z.string()).max(10),
});

const CAPTION_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  required: ["caption", "hashtags"],
  properties: {
    caption: { type: "string" },
    hashtags: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 10,
    },
  },
};

const CAPTION_SYSTEM =
  "You write Instagram/TikTok captions for beauty and fashion DTC brands. " +
  "Caption is under 180 characters, matches the tone, never uses hashtags inline. " +
  "Hashtags: 5-10 relevant ones, mix of brand-specific and category trending, no banned words. " +
  "Output JSON only matching the schema.";

export async function generateCaption(input: CaptionInput): Promise<CaptionOutput> {
  try {
    const result = await generateStructured({
      model: VERTEX_MODELS.lite,
      system: CAPTION_SYSTEM,
      userText: `Generate a caption for this post:\n${JSON.stringify(input, null, 2)}`,
      schema: CaptionSchema,
      responseSchema: CAPTION_RESPONSE_SCHEMA,
      maxOutputTokens: 512,
      temperature: 0.7,
    });
    return {
      caption: result.data.caption.slice(0, 300),
      hashtags: result.data.hashtags.slice(0, 10),
    };
  } catch {
    return { caption: "", hashtags: [] };
  }
}

export interface RetryModifyInput {
  originalPrompt: string;
  reasons: string[];
  note?: string;
}

const RETRY_SYSTEM =
  "You modify an AI image-generation prompt based on structured feedback. " +
  "Return ONLY the revised prompt text — no explanation, no prose. " +
  "Keep the same scene, but adjust the specific aspects that the feedback flagged. " +
  "Preserve product accuracy and negative prompts.";

export async function modifyPromptForRetry(input: RetryModifyInput): Promise<string> {
  const userText =
    `Original prompt:\n${input.originalPrompt}\n\n` +
    `Feedback (these went wrong): ${input.reasons.join(", ")}` +
    `${input.note ? `\nAdditional note: ${input.note}` : ""}\n\n` +
    `Return the revised prompt only.`;

  const revised = await generateText({
    model: VERTEX_MODELS.lite,
    system: RETRY_SYSTEM,
    userText,
    maxOutputTokens: 1024,
    temperature: 0.4,
  });
  return revised.trim();
}
