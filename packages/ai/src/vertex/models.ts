export const VERTEX_MODELS = {
  // Text / vision
  reasoning: "gemini-2.5-pro",           // scenario generation
  vision: "gemini-2.5-flash",            // QC vision judge, brand inference
  lite: "gemini-2.5-flash-lite",         // captions, retry, scene ranking

  // Image
  imageNative: "imagen-3.0-fast-generate-001", // Imagen 3 Fast — image generation on Vertex Express
  imagenHQ: "imagen-3.0-generate-002",           // Editorial Hero / CGI HQ
  imagenFast: "imagen-3.0-fast-generate-001",    // fallback / cheap path

  // Video
  veo3: "veo-3.0-generate-001",
  veo2: "veo-2.0-generate-001",

  // Embeddings
  multimodalEmbedding: "multimodalembedding@001",
} as const;

export type VertexModelId = (typeof VERTEX_MODELS)[keyof typeof VERTEX_MODELS];

export const VERTEX_PRICING_USD = {
  // LLM pricing per 1M tokens (input / output)
  [VERTEX_MODELS.reasoning]: { input: 1.25 / 1_000_000, output: 10 / 1_000_000 },
  [VERTEX_MODELS.vision]: { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
  [VERTEX_MODELS.lite]: { input: 0.075 / 1_000_000, output: 0.3 / 1_000_000 },
  // Image pricing per generated image
  [VERTEX_MODELS.imageNative]: { image: 0.039 },
  [VERTEX_MODELS.imagenHQ]: { image: 0.06 },
  [VERTEX_MODELS.imagenFast]: { image: 0.02 },
  // Video pricing per output second
  [VERTEX_MODELS.veo3]: { second: 0.75 },
  [VERTEX_MODELS.veo2]: { second: 0.35 },
  // Embedding pricing per call
  [VERTEX_MODELS.multimodalEmbedding]: { image: 0.00002, text: 0.00002 },
} as const;

export function estimateLlmCost(
  modelId: VertexModelId,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = VERTEX_PRICING_USD[modelId] as { input?: number; output?: number };
  if (!price.input || !price.output) return 0;
  return inputTokens * price.input + outputTokens * price.output;
}
