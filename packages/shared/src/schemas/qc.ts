import { z } from "zod";

export const QcVerdict = z.enum(["pass", "fail", "borderline"]);
export type QcVerdict = z.infer<typeof QcVerdict>;

export const QcMetricsSchema = z.object({
  productIdentity: z.number().min(0).max(100),
  promptFidelity: z.number().min(0).max(100),
  aestheticQuality: z.number().min(0).max(100),
  brandColorMatch: z.number().min(0).max(100),
  compositionQuality: z.number().min(0).max(100),
  referenceAlignment: z.number().min(0).max(100),
});
export type QcMetrics = z.infer<typeof QcMetricsSchema>;

export const QcHardFailSchema = z.object({
  nsfwScore: z.number().min(0).max(1),
  blurVariance: z.number().nonnegative(),
  corrupted: z.boolean().default(false),
  faceCountViolation: z.boolean().default(false),
  faceCount: z.number().int().nonnegative(),
  faceSimilarityScore: z.number().min(0).max(1).optional(),
});
export type QcHardFail = z.infer<typeof QcHardFailSchema>;

export const QcResultSchema = z.object({
  metrics: QcMetricsSchema,
  hardFails: QcHardFailSchema,
  composite: z.number().min(0).max(100),
  verdict: QcVerdict,
  autoApproved: z.boolean(),
  reasons: z.array(z.string()),
  stylePreset: z.string(),
  profileId: z.string().optional(),
});
export type QcResult = z.infer<typeof QcResultSchema>;

export const RetryReasonEnum = z.enum([
  "too_dark",
  "too_bright",
  "wrong_angle",
  "color_off",
  "product_distorted",
  "background_busy",
  "composition_bad",
  "other",
]);
export type RetryReason = z.infer<typeof RetryReasonEnum>;

export const RetryFeedbackSchema = z.object({
  chosenIndex: z.number().int().nonnegative().optional(),
  issues: z.array(RetryReasonEnum).default([]),
  note: z.string().max(500).optional(),
});
export type RetryFeedback = z.infer<typeof RetryFeedbackSchema>;
