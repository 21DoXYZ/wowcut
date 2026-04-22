import type { schemas } from "@wowcut/shared";
import type { StylePreset, UnitFormat } from "./presets";
import { STYLE_TOKENS, UNIVERSAL_NEGATIVES } from "./style-tokens";

export interface CompilerProduct {
  name: string;
  category: string;
  shape?: string;
  material?: string;
  primaryColor?: string | null;
  imageUrl: string;
  notes?: string | null;
}

export interface CompilerClient {
  toneOfVoice?: string | null;
  brandColors?: string[];
  brandFaceId?: string | null;
}

export interface CompilerBrandFace {
  id: string;
  referenceUrl: string;
  descriptors: Record<string, unknown>;
}

export interface CompilerInput {
  preset: StylePreset;
  product: CompilerProduct;
  client?: CompilerClient;
  brandFace?: CompilerBrandFace;
  format: UnitFormat;
  seed?: number;
  scenarioSnapshot?: schemas.BrandScenario;
  sceneId?: string;
  isPreview?: boolean;
}

export interface CompiledPrompt {
  prompt: string;
  negative: string;
  referenceImages: string[];
  params: Record<string, unknown>;
}

export function compilePrompt(input: CompilerInput): CompiledPrompt {
  const { preset, product, client, brandFace, format, seed, scenarioSnapshot, sceneId, isPreview } = input;
  const tokens = STYLE_TOKENS[preset.id];

  let scene: schemas.SceneVariant | null = null;
  if (scenarioSnapshot && sceneId) {
    const stylePool =
      preset.id === "social_style" || preset.id === "editorial_hero" || preset.id === "cgi_concept"
        ? scenarioSnapshot.sceneVariantsByStyle[preset.id]
        : [];
    scene = stylePool.find((s) => s.id === sceneId) ?? null;
  }
  const mood = scenarioSnapshot?.moodKeywords.slice(0, 5).join(", ") ?? "";
  const grading = scenarioSnapshot?.colorGrading ?? "";

  const productDescriptor = [
    product.name,
    product.shape && `${product.shape} shape`,
    product.material && `${product.material} finish`,
    product.primaryColor && `primary color ${product.primaryColor}`,
  ]
    .filter(Boolean)
    .join(", ");

  const modelRef = brandFace
    ? "the brand face reference (consistent identity across all assets)"
    : null;

  const parts: string[] = [
    tokens.opening,
    `Subject: ${productDescriptor}.`,
  ];
  if (modelRef && preset.id === "fashion_campaign") {
    parts.push(`${modelRef} wearing or using the product.`);
  }
  if (scene) {
    parts.push(
      `Scene: on ${scene.surface}, ${scene.lighting}, ${scene.angle} angle, ${scene.composition} composition.`,
    );
    parts.push(`Context: ${scene.propsOrContext}.`);
  }
  parts.push(`Style: ${tokens.styleTokens}.`);
  if (mood) parts.push(`Mood: ${mood}.`);
  if (grading) parts.push(`Color: ${grading}.`);
  parts.push(`Quality: ${tokens.qualityClause}.`);

  if (format === "short_motion") {
    parts.push("5-8 second cinematic shot with subtle camera movement, product remains sharp.");
  } else if (format === "animated_still") {
    parts.push("Subtle parallax motion, static product remains sharp.");
  }

  const negative = [tokens.negative, UNIVERSAL_NEGATIVES, ...(scenarioSnapshot?.avoidList ?? [])].join(", ");

  const referenceImages = [product.imageUrl];
  if (brandFace) referenceImages.push(brandFace.referenceUrl);

  return {
    prompt: parts.join(" ").replace(/\s+/g, " ").trim(),
    negative: negative.trim(),
    referenceImages,
    params: {
      seed: seed ?? Math.floor(Math.random() * 2 ** 31),
      aspectRatio: preset.aspectRatios[0] ?? tokens.aspectDefault,
      format,
      preset: preset.id,
      isPreview: Boolean(isPreview),
    },
  };
}
