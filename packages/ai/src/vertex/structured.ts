import type { z } from "zod";
import { getVertex, type VertexImagePart } from "./client";
import type { VertexModelId } from "./models";

export interface GenerateStructuredInput<TSchema extends z.ZodTypeAny> {
  model: VertexModelId;
  system: string;
  userText: string;
  images?: VertexImagePart[];
  schema: TSchema;
  /**
   * JSON Schema (Vertex accepts a subset of OpenAPI-like schema objects).
   * Provided per call to keep responseSchema aligned with the Zod schema.
   */
  responseSchema: Record<string, unknown>;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface StructuredResult<T> {
  data: T;
  rawText: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  safety: unknown;
}

export async function generateStructured<TSchema extends z.ZodTypeAny>(
  input: GenerateStructuredInput<TSchema>,
): Promise<StructuredResult<z.infer<TSchema>>> {
  const ai = getVertex();

  const parts: Array<Record<string, unknown>> = [];
  for (const img of input.images ?? []) {
    parts.push({
      inlineData: { mimeType: img.mediaType, data: img.base64 },
    });
    if (img.label) parts.push({ text: `[${img.label}]` });
  }
  parts.push({ text: input.userText });

  const response = await ai.models.generateContent({
    model: input.model,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: input.system,
      responseMimeType: "application/json",
      responseSchema: input.responseSchema as never,
      maxOutputTokens: input.maxOutputTokens ?? 4096,
      temperature: input.temperature ?? 0.5,
    },
  });

  const rawText = response.text ?? "";
  const parsed = JSON.parse(rawText);
  const data = input.schema.parse(parsed);

  const usage = response.usageMetadata ?? { promptTokenCount: 0, candidatesTokenCount: 0 };
  return {
    data,
    rawText,
    usage: {
      inputTokens: usage.promptTokenCount ?? 0,
      outputTokens: usage.candidatesTokenCount ?? 0,
    },
    safety: response.candidates?.[0]?.safetyRatings ?? [],
  };
}

export interface GenerateTextInput {
  model: VertexModelId;
  system: string;
  userText: string;
  images?: VertexImagePart[];
  maxOutputTokens?: number;
  temperature?: number;
}

export async function generateText(input: GenerateTextInput): Promise<string> {
  const ai = getVertex();
  const parts: Array<Record<string, unknown>> = [];
  for (const img of input.images ?? []) {
    parts.push({ inlineData: { mimeType: img.mediaType, data: img.base64 } });
    if (img.label) parts.push({ text: `[${img.label}]` });
  }
  parts.push({ text: input.userText });

  const response = await ai.models.generateContent({
    model: input.model,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: input.system,
      maxOutputTokens: input.maxOutputTokens ?? 2048,
      temperature: input.temperature ?? 0.4,
    },
  });
  return response.text ?? "";
}
