import { z } from "zod";
import { StylePresetIdEnum } from "./brief";

export const SceneVariantSchema = z.object({
  id: z.string().min(1),
  headline: z.string().min(1).max(60),
  surface: z.string().min(1),
  lighting: z.string().min(1),
  angle: z.enum(["eye-level", "overhead", "3/4", "side", "low", "hero"]),
  composition: z.enum([
    "centered",
    "rule-of-thirds-left",
    "rule-of-thirds-right",
    "negative-space-top",
    "negative-space-bottom",
    "symmetrical",
    "diagonal-dynamic",
  ]),
  propsOrContext: z.string().min(1),
  referenceAnchor: z.string().optional(),
});
export type SceneVariant = z.infer<typeof SceneVariantSchema>;

export const BrandScenarioSchema = z.object({
  creativeDirection: z.string().min(20).max(800),
  moodKeywords: z.array(z.string()).min(3).max(8),
  surfaceLibrary: z.array(z.string()).min(5).max(12),
  lightingTokens: z.array(z.string()).min(4).max(10),
  colorGrading: z.string().min(10).max(200),
  avoidList: z.array(z.string()).min(3).max(12),
  sceneVariantsByStyle: z.object({
    social_style: z.array(SceneVariantSchema).length(3),
    editorial_hero: z.array(SceneVariantSchema).length(3),
    cgi_concept: z.array(SceneVariantSchema).length(3),
  }),
  recommendedMix: z.object({
    primaryStyle: StylePresetIdEnum,
    secondaryStyle: StylePresetIdEnum,
    reasoning: z.string().min(10).max(300),
  }),
});
export type BrandScenario = z.infer<typeof BrandScenarioSchema>;

export const MoodboardImageMetaSchema = z.object({
  index: z.number().int().min(0).max(8),
  stylePreset: z.enum(["social_style", "editorial_hero", "cgi_concept"]),
  sceneId: z.string(),
  sceneHeadline: z.string(),
  url: z.string().url(),
  seed: z.number().int(),
  qcComposite: z.number(),
  costUsd: z.number(),
});
export type MoodboardImageMeta = z.infer<typeof MoodboardImageMetaSchema>;
