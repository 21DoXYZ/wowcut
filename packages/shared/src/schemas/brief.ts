import { z } from "zod";

export const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be #RRGGBB");

export const SkuCategoryEnum = z.enum([
  "cream",
  "serum",
  "lipstick",
  "foundation",
  "perfume",
  "hair_care",
  "body_care",
  "bag",
  "shoe",
  "apparel",
  "accessory",
  "other",
]);

export const SkuShapeEnum = z.enum([
  "bottle",
  "tube",
  "jar",
  "compact",
  "flat_pack",
  "box",
  "garment",
  "other",
]);

export const SkuMaterialEnum = z.enum([
  "glass",
  "plastic",
  "metallic_matte",
  "metallic_gloss",
  "fabric",
  "leather",
  "other",
]);

export const StylePresetIdEnum = z.enum([
  "social_style",
  "editorial_hero",
  "fashion_campaign",
  "cgi_concept",
]);

export const ChannelEnum = z.enum(["instagram", "tiktok", "pinterest", "website"]);

export const ToneOfVoiceEnum = z.enum(["minimal", "bold", "playful"]);

export const PreviewStyleEnum = z.enum(["social_style", "editorial_hero", "cgi_concept"]);

// Used after checkout — confirm brief using the data already collected in preview intake.
// previewId is optional — derived server-side from client.convertedFromPreviewId when absent.
export const ConfirmOnboardingSchema = z.object({
  previewId: z.string().min(1).optional(),
  brandNameOverride: z.string().min(1).max(80).optional(),
  toneOfVoice: ToneOfVoiceEnum.default("minimal"),
  channels: z.array(ChannelEnum).min(1).default(["instagram"]),
});
export type ConfirmOnboarding = z.infer<typeof ConfirmOnboardingSchema>;
