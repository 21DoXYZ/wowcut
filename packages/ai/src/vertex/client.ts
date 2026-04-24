import { GoogleGenAI } from "@google/genai";

let cachedText: GoogleGenAI | null = null;
let cachedImage: GoogleGenAI | null = null;

function getApiKey(): string {
  const apiKey = process.env.VERTEX_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("VERTEX_API_KEY is not configured");
  return apiKey;
}

/**
 * Gemini Developer API client — for text/vision models (gemini-2.5-pro, flash).
 * Uses generativelanguage.googleapis.com via API key.
 */
export function getVertex(): GoogleGenAI {
  if (cachedText) return cachedText;
  cachedText = new GoogleGenAI({ apiKey: getApiKey() });
  return cachedText;
}

/**
 * Vertex AI Express client — for image generation models (imagen-3, gemini-image).
 * Uses aiplatform.googleapis.com via API key + vertexai:true.
 */
export function getVertexImage(): GoogleGenAI {
  if (cachedImage) return cachedImage;
  cachedImage = new GoogleGenAI({ apiKey: getApiKey(), vertexai: true });
  return cachedImage;
}

export type VertexImagePart = {
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  base64: string;
  label?: string;
};
