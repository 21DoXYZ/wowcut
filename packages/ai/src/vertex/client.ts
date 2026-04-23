import { GoogleGenAI } from "@google/genai";

let cached: GoogleGenAI | null = null;

/**
 * Returns a cached GoogleGenAI client configured for Vertex AI Express Mode.
 * Auth is API-key based — works against https://aiplatform.googleapis.com.
 */
export function getVertex(): GoogleGenAI {
  if (cached) return cached;
  const apiKey = process.env.VERTEX_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VERTEX_API_KEY is not configured");
  }
  cached = new GoogleGenAI({
    apiKey,
    vertexai: true,
    location: process.env.VERTEX_LOCATION ?? "us-central1",
  });
  return cached;
}

export type VertexImagePart = {
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  base64: string;
  label?: string;
};
