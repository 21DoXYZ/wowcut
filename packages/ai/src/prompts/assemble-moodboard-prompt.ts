import type { schemas } from "@wowcut/shared";
import type { StylePresetId } from "./presets";
import { STYLE_TOKENS, UNIVERSAL_NEGATIVES } from "./style-tokens";
import type { ProductInference } from "../infer-product";

export interface AssembleMoodboardPromptInput {
  stylePreset: StylePresetId;
  scene: schemas.SceneVariant;
  scenario: schemas.BrandScenario;
  product: schemas.IntakeProduct;
  productInference?: ProductInference;
  seed?: number;
  isPreview?: boolean;
  aspectRatio?: string;
}

export interface AssembledPrompt {
  prompt: string;
  negative: string;
  seed: number;
  aspectRatio: string;
  meta: {
    stylePreset: StylePresetId;
    sceneId: string;
    productId: string;
  };
}

export function assembleMoodboardPrompt(
  input: AssembleMoodboardPromptInput,
): AssembledPrompt {
  const { stylePreset, scene, scenario, product, productInference, isPreview } = input;
  const tokens = STYLE_TOKENS[stylePreset];

  // Use AI-inferred product description when available; fall back to intake fields
  const productDescriptor = productInference
    ? productInference.shortDescription
    : [
        product.nameGuess ?? "product",
        product.shape ? `${product.shape} shape` : null,
        product.material ? `${product.material} finish` : null,
        product.dominantColor ? `dominant color ${product.dominantColor}` : null,
      ]
        .filter(Boolean)
        .join(", ");

  const moodLine = scenario.moodKeywords.slice(0, 6).join(", ");

  const parts: string[] = [
    tokens.opening,
    `Subject: ${productDescriptor} — clearly visible as the primary focal subject, product must be faithfully reproduced.`,
    `Scene: on ${scene.surface}, ${scene.lighting}, ${scene.angle} angle, ${scene.composition} composition.`,
    `Context: ${scene.propsOrContext}.`,
    `Style: ${tokens.styleTokens}.`,
    `Mood: ${moodLine}.`,
    `Color: ${scenario.colorGrading}.`,
    `Quality: ${tokens.qualityClause}.`,
  ];

  if (isPreview) {
    parts.push(
      "Subtle 'WOWCUT PREVIEW' watermark in bottom-right corner, small and unobtrusive.",
    );
  }

  const negative = [
    tokens.negative,
    UNIVERSAL_NEGATIVES,
    ...scenario.avoidList,
  ]
    .join(", ");

  const seed = input.seed ?? Math.floor(Math.random() * 2 ** 31);
  const aspectRatio = input.aspectRatio ?? tokens.aspectDefault;

  return {
    prompt: parts.join(" ").replace(/\s+/g, " ").trim(),
    negative: negative.replace(/\s+/g, " ").trim(),
    seed,
    aspectRatio,
    meta: {
      stylePreset,
      sceneId: scene.id,
      productId: product.uploadId,
    },
  };
}
