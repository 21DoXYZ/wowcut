import { GoogleGenAI } from "@google/genai";

let cached: GoogleGenAI | null = null;

/**
 * Returns a cached GoogleGenAI client using Gemini Developer API (API key).
 * Works with any key from Google AI Studio or GCP that has Gemini access.
 */
export function getVertex(): GoogleGenAI {
  if (cached) return cached;
  const apiKey = process.env.VERTEX_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VERTEX_API_KEY is not configured");
  }
  cached = new GoogleGenAI({ apiKey });
  return cached;
}

export type VertexImagePart = {
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  base64: string;
  label?: string;
};
