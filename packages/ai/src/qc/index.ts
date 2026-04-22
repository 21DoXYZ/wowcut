import type { StylePreset } from "../prompts/presets";
import type { schemas } from "@wowcut/shared";
import { composeVerdict, type StyleProfile, type QcInputMetrics } from "./composite";
import { embedImage, cosineSimilarity, fetchAndEmbedImageUrl } from "./embeddings";
import { judgeWithVision } from "./vision-judge";
import { deltaE76, hexToRgb, minDeltaE } from "./metrics";

export * from "./composite";
export * from "./metrics";
export * from "./embeddings";
export * from "./safety";
export * from "./vision-judge";

type MediaType = "image/jpeg" | "image/png" | "image/webp";

export interface RunQcInput {
  preset: StylePreset;
  profile: StyleProfile;
  generatedImageUrl: string;
  productImageUrl: string;
  referenceImageUrls: string[];
  brandColorsHex: string[];
  prompt: string;
  brandFaceReferenceUrl?: string;
  precomputed?: Partial<QcInputMetrics>;
  // If provided, these are passed to the vision judge directly (no refetch).
  generatedImageBase64?: string;
  generatedImageMediaType?: MediaType;
}

export async function runQc(input: RunQcInput): Promise<schemas.QcResult> {
  // 1. Vision judge — combines prompt fidelity + composition + aesthetic + face count
  //    into one Claude-replacement call.
  const visionP = input.generatedImageBase64
    ? judgeWithVision({
        imageBase64: input.generatedImageBase64,
        imageMediaType: input.generatedImageMediaType ?? "image/jpeg",
        prompt: input.prompt,
        stylePreset: input.preset.id,
      })
    : Promise.resolve(null);

  // 2. Multimodal embeddings for CLIP-style similarity (product identity + reference alignment)
  const generatedEmbeddingP = input.generatedImageBase64
    ? embedImage({
        base64: input.generatedImageBase64,
        mediaType: input.generatedImageMediaType ?? "image/jpeg",
      })
    : fetchAndEmbedImageUrl(input.generatedImageUrl);
  const originalEmbeddingP = fetchAndEmbedImageUrl(input.productImageUrl);
  const refEmbeddingsP = Promise.all(
    input.referenceImageUrls.map((u) => fetchAndEmbedImageUrl(u)),
  );

  const [vision, generatedEmbedding, originalEmbedding, refEmbeddings] = await Promise.all([
    visionP,
    generatedEmbeddingP,
    originalEmbeddingP,
    refEmbeddingsP,
  ]);

  // 3. Product identity — CLIP cosine between generated and original product
  const productIdentitySim = cosineSimilarity(generatedEmbedding, originalEmbedding);

  // 4. Reference alignment — averaged cosine against user references
  const refSimilarities = refEmbeddings
    .map((e) => cosineSimilarity(generatedEmbedding, e))
    .filter((s) => s > 0);
  const referenceAlignment =
    refSimilarities.length > 0
      ? refSimilarities.reduce((a, b) => a + b, 0) / refSimilarities.length
      : 0.5;

  // 5. Brand color ΔE (local — no API call). If precomputed supplied use that, else default 10.
  const brandColorDeltaE = input.precomputed?.brandColorDeltaE ?? (() => {
    // Light approximation: no dominant-color extraction here (needs a sharp/canvas
    // side channel). Preview worker can provide this via precomputed; fall back to neutral.
    const refs = input.brandColorsHex.map(hexToRgb);
    if (refs.length === 0) return 10;
    // Average palette delta against a neutral mid-grey as loose baseline.
    const neutral = { r: 128, g: 128, b: 128 };
    return minDeltaE(neutral, refs);
  })();

  const vj = vision ?? {
    promptFidelity: 0.5,
    composition: 60,
    aesthetic: 5.5,
    faceCount: 0,
    productIdentityDelta: "preserved" as const,
    reasoning: "no_vision_input",
  };

  // If vision says product identity is broken, penalize similarity metric
  const productIdentityBoosted =
    vj.productIdentityDelta === "broken"
      ? Math.min(productIdentitySim, 0.5)
      : vj.productIdentityDelta === "partial"
        ? Math.min(productIdentitySim, 0.75)
        : productIdentitySim;

  // NSFW — derived from vision judge's reasoning + separate safety call not yet wired here.
  // We could query gemini-2.5-flash with {safetySettings:"BLOCK_NONE"} for raw ratings.
  // For now assume not NSFW unless precomputed.
  const nsfwScore = input.precomputed?.nsfwScore ?? 0;

  const raw: QcInputMetrics = {
    productIdentitySimilarity: productIdentityBoosted,
    promptFidelitySimilarity: vj.promptFidelity,
    aestheticScoreRaw: vj.aesthetic,
    brandColorDeltaE,
    compositionScoreRaw: vj.composition,
    referenceAlignmentSimilarity: referenceAlignment,
    nsfwScore,
    blurVariance: input.precomputed?.blurVariance ?? 120,
    corrupted: false,
    faceCount: vj.faceCount,
    faceSimilarityScore: input.precomputed?.faceSimilarityScore,
  };

  return composeVerdict({ stylePreset: input.preset.id, profile: input.profile, raw });
}
