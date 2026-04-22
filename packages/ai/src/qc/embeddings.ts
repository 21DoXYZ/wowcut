import { getVertex } from "../vertex/client";
import { VERTEX_MODELS } from "../vertex/models";

type MediaType = "image/jpeg" | "image/png" | "image/webp";

export interface EmbedImageInput {
  base64?: string;
  mediaType?: MediaType;
  url?: string;
}

/**
 * Call Vertex multimodalembedding@001 with an image (and optionally text).
 * Returns the 1408-dim image embedding. Returns empty array on error.
 */
export async function embedImage(input: EmbedImageInput): Promise<number[]> {
  const ai = getVertex();
  try {
    const instances: Array<Record<string, unknown>> = [];
    const image: Record<string, unknown> = {};
    if (input.base64) image.bytesBase64Encoded = input.base64;
    if (input.url) image.gcsUri = input.url;
    instances.push({ image });

    const response = await ai.models.embedContent({
      model: VERTEX_MODELS.multimodalEmbedding,
      contents: instances as never,
    });

    const first = response.embeddings?.[0];
    return first?.values ?? [];
  } catch (err) {
    console.error("[embeddings] failed", (err as Error).message);
    return [];
  }
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
