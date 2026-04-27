import { z } from "zod";
import { SkuCategoryEnum, SkuShapeEnum, SkuMaterialEnum, HexColor } from "./brief";

export const IntakeProductSchema = z.object({
  uploadId: z.string().min(1),
  imageUrl: z.string().url(),
  nameGuess: z.string().optional(),
  category: SkuCategoryEnum.optional(),
  shape: SkuShapeEnum.optional(),
  material: SkuMaterialEnum.optional(),
  dominantColor: HexColor.optional(),
});
export type IntakeProduct = z.infer<typeof IntakeProductSchema>;

export const IntakeReferenceSchema = z.object({
  uploadId: z.string().min(1),
  imageUrl: z.string().url(),
  source: z.enum(["user_upload", "gallery_preset"]).default("user_upload"),
  paletteExtracted: z.array(HexColor).max(6).optional(),
});
export type IntakeReference = z.infer<typeof IntakeReferenceSchema>;

export const StylePresetEnum = z.enum([
  "social_style",
  "editorial_hero",
  "cgi_concept",
  "fashion_campaign",
]);

export const BriefIntakeSchema = z.object({
  brandName: z.string().min(1).max(80).optional(),
  products: z.array(IntakeProductSchema).min(1).max(3),
  references: z.array(IntakeReferenceSchema).min(0).max(5),
  brandColor: HexColor,
  secondaryColor: HexColor.optional(),
  selectedStyles: z.array(StylePresetEnum).min(1).max(4).optional(),
});
export type BriefIntake = z.infer<typeof BriefIntakeSchema>;
