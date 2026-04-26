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

  // Build rich product descriptor from AI inference or intake fields
  let productDescriptor: string;
  let productMaterialDetail = "";
  if (productInference) {
    const inf = productInference;
    const colorLine = inf.accentColors && inf.accentColors !== "none"
      ? `${inf.dominantColor} with ${inf.accentColors}`
      : inf.dominantColor;
    const materialLine = [inf.material, inf.texture, `${inf.finish} finish`].filter(Boolean).join(", ");
    productMaterialDetail = `Material: ${materialLine}.`;
    const featuresLine = inf.distinctiveFeatures && inf.distinctiveFeatures !== "none"
      ? ` Distinctive features: ${inf.distinctiveFeatures}.`
      : "";
    productDescriptor = `${inf.shortDescription} Color: ${colorLine}. Shape: ${inf.shape}.${featuresLine}`;
  } else {
    productDescriptor = [
      product.nameGuess ?? "product",
      product.shape ? `${product.shape} shape` : null,
      product.material ? `${product.material} finish` : null,
      product.dominantColor ? `color: ${product.dominantColor}` : null,
    ]
      .filter(Boolean)
      .join(", ");
  }

  const moodLine = scenario.moodKeywords.slice(0, 6).join(", ");

  const parts: string[] = [
    tokens.opening,
    `PRODUCT (must be faithfully reproduced as primary focal subject): ${productDescriptor}`,
    productMaterialDetail,
    `Scene: ${scene.surface}, ${scene.lighting} lighting, ${scene.angle} angle, ${scene.composition} composition.`,
    `Props and context: ${scene.propsOrContext}.`,
    `Style: ${tokens.styleTokens}.`,
    `Mood: ${moodLine}.`,
    `Color grading: ${scenario.colorGrading}.`,
    `Quality: ${tokens.qualityClause}.`,
  ].filter(Boolean);

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
