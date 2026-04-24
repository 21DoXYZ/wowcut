type MediaType = "image/jpeg" | "image/png" | "image/webp";

export interface EmbedImageInput {
  base64?: string;
  mediaType?: MediaType;
  url?: string;
}

/**
 * Multimodal embeddings are disabled — multimodalembedding@001 requires the
 * Vertex AI Predict API which is not exposed by the @google/genai SDK.
 * QC ranking falls back to prompt-match score only.
 */
export async function embedImage(_input: EmbedImageInput): Promise<number[]> {
  return [];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function fetchAndEmbedImageUrl(url: string): Promise<number[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const mediaType: MediaType = contentType.includes("png")
      ? "image/png"
      : contentType.includes("webp")
        ? "image/webp"
        : "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());
    return embedImage({ base64: buffer.toString("base64"), mediaType });
  } catch {
    return [];
  }
}
