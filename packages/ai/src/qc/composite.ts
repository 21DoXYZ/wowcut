import {
  QC_METRIC_WEIGHTS,
  QC_THRESHOLDS_DEFAULT,
  schemas,
} from "@wowcut/shared";
import type { StylePresetId } from "../prompts/presets";

export interface StyleProfile {
  stylePreset: StylePresetId;
  compositeAutoApprove: number;
  compositePass: number;
  productIdentityMin: number;
  promptFidelityMin: number;
  aestheticMin: number;
  brandColorDeltaMax: number;
  compositionMin: number;
  faceCountMin: number;
  faceCountMax: number;
  faceSimilarityMin?: number | null;
  blurVarianceMin: number;
  noveltyMin?: number | null;
}

export interface QcInputMetrics {
  productIdentitySimilarity: number; // 0-1 (CLIP cosine to original product)
  promptFidelitySimilarity: number; // 0-1 (CLIP cosine to prompt)
  aestheticScoreRaw: number; // 0-10 aesthetic predictor
  brandColorDeltaE: number; // 0-100 ΔE76
  compositionScoreRaw: number; // 0-100 custom
  referenceAlignmentSimilarity: number; // 0-1
  // Hard fail sources
  nsfwScore: number; // 0-1
  blurVariance: number; // laplacian
  corrupted: boolean;
  faceCount: number;
  faceSimilarityScore?: number; // 0-1 for fashion
}

export interface QcComposeInput {
  stylePreset: StylePresetId;
  profile: StyleProfile;
  raw: QcInputMetrics;
}

function normalize0to100(value: number, floor: number, ceil: number): number {
  if (ceil === floor) return 0;
  const clamped = Math.max(floor, Math.min(ceil, value));
  return ((clamped - floor) / (ceil - floor)) * 100;
}

export function composeVerdict(input: QcComposeInput): schemas.QcResult {
  const { profile, raw, stylePreset } = input;
  const reasons: string[] = [];

  // Hard fails
  let faceViolation = false;
  if (raw.faceCount < profile.faceCountMin || raw.faceCount > profile.faceCountMax) {
    faceViolation = true;
    reasons.push(`face_count_violation:${raw.faceCount}`);
  }
  const hardFail =
    raw.corrupted ||
    raw.nsfwScore >= QC_THRESHOLDS_DEFAULT.hardFailNsfw ||
    raw.blurVariance < Math.max(QC_THRESHOLDS_DEFAULT.hardFailBlurMin, profile.blurVarianceMin * 0.5) ||
    faceViolation;

  if (raw.corrupted) reasons.push("corrupted");
  if (raw.nsfwScore >= QC_THRESHOLDS_DEFAULT.hardFailNsfw) reasons.push(`nsfw:${raw.nsfwScore.toFixed(2)}`);
  if (raw.blurVariance < QC_THRESHOLDS_DEFAULT.hardFailBlurMin)
    reasons.push(`hard_blur:${raw.blurVariance.toFixed(0)}`);

  // Normalize each metric to 0-100
  const productIdentity = normalize0to100(raw.productIdentitySimilarity, 0.5, 1.0);
  const promptFidelity = normalize0to100(raw.promptFidelitySimilarity, 0.2, 0.45);
  const aesthetic = normalize0to100(raw.aestheticScoreRaw, 3, 8);
  const brandColorMatch = normalize0to100(
    Math.max(0, profile.brandColorDeltaMax * 2 - raw.brandColorDeltaE),
    0,
    profile.brandColorDeltaMax * 2,
  );
  const composition = Math.max(0, Math.min(100, raw.compositionScoreRaw));
  const referenceAlignment = normalize0to100(raw.referenceAlignmentSimilarity, 0.4, 0.9);

  // Soft-fail checks per profile
  const softFailProductIdentity = raw.productIdentitySimilarity < profile.productIdentityMin;
  const softFailPromptFidelity = raw.promptFidelitySimilarity < profile.promptFidelityMin;
  const softFailAesthetic = raw.aestheticScoreRaw < profile.aestheticMin;
  const softFailColor = raw.brandColorDeltaE > profile.brandColorDeltaMax;
  const softFailComposition = raw.compositionScoreRaw < profile.compositionMin;
  const softFailFaceSim =
    profile.faceSimilarityMin != null &&
    (raw.faceSimilarityScore ?? 0) < profile.faceSimilarityMin;

  if (softFailProductIdentity)
    reasons.push(`product_identity_low:${raw.productIdentitySimilarity.toFixed(2)}`);
  if (softFailPromptFidelity)
    reasons.push(`prompt_fidelity_low:${raw.promptFidelitySimilarity.toFixed(2)}`);
  if (softFailAesthetic) reasons.push(`aesthetic_low:${raw.aestheticScoreRaw.toFixed(1)}`);
  if (softFailColor) reasons.push(`brand_color_off:${raw.brandColorDeltaE.toFixed(1)}`);
  if (softFailComposition) reasons.push(`composition_weak:${raw.compositionScoreRaw.toFixed(0)}`);
  if (softFailFaceSim)
    reasons.push(`face_sim_low:${raw.faceSimilarityScore?.toFixed(2) ?? "n/a"}`);

  // Composite
  const composite =
    QC_METRIC_WEIGHTS.productIdentity * productIdentity +
    QC_METRIC_WEIGHTS.promptFidelity * promptFidelity +
    QC_METRIC_WEIGHTS.aestheticQuality * aesthetic +
    QC_METRIC_WEIGHTS.brandColorMatch * brandColorMatch +
    QC_METRIC_WEIGHTS.compositionQuality * composition +
    QC_METRIC_WEIGHTS.referenceAlignment * referenceAlignment;

  let verdict: schemas.QcVerdict;
  let autoApproved = false;

  if (hardFail) {
    verdict = "fail";
  } else {
    const anySoftFail =
      softFailProductIdentity ||
      softFailPromptFidelity ||
      softFailAesthetic ||
      softFailColor ||
      softFailComposition ||
      softFailFaceSim;

    if (composite >= profile.compositeAutoApprove && !anySoftFail) {
      verdict = "pass";
      autoApproved = true;
    } else if (composite >= profile.compositePass && !softFailProductIdentity && !softFailColor) {
      verdict = "pass";
    } else {
      verdict = "borderline";
    }
  }

  return {
    metrics: {
      productIdentity,
      promptFidelity,
      aestheticQuality: aesthetic,
      brandColorMatch,
      compositionQuality: composition,
      referenceAlignment,
    },
    hardFails: {
      nsfwScore: raw.nsfwScore,
      blurVariance: raw.blurVariance,
      corrupted: raw.corrupted,
      faceCountViolation: faceViolation,
      faceCount: raw.faceCount,
      faceSimilarityScore: raw.faceSimilarityScore,
    },
    composite: Math.round(composite * 10) / 10,
    verdict,
    autoApproved,
    reasons,
    stylePreset,
  };
}
