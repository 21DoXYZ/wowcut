export type StylePresetId =
  | "social_style"
  | "editorial_hero"
  | "fashion_campaign"
  | "cgi_concept";

export type UnitFormat = "static" | "animated_still" | "short_motion";

export type GenerationModel =
  | "nano_banana_2"
  | "nano_banana_2_hq"
  | "kling_v2"
  | "seedance_v2_pro"
  | "flux_pro"
  | "runway_gen3";

export interface StylePreset {
  id: StylePresetId;
  name: string;
  description: string;
  promptTemplate: string;
  negativePrompt: string;
  preferredModel: GenerationModel;
  motionModel?: GenerationModel;
  supportedFormats: UnitFormat[];
  aspectRatios: string[];
  alternatesCount: { static: number; motion: number };
  qcThresholds: {
    clipScoreMin?: number;
    brandColorDeltaEMax?: number;
    faceCountMin?: number;
    faceCountMax?: number;
    faceSimilarityMin?: number;
  };
  referenceKeys: string[];
  availableInPreview: boolean;
  planGate: "base" | "premium";
}

export const STYLE_PRESETS: Record<StylePresetId, StylePreset> = {
  social_style: {
    id: "social_style",
    name: "Social Style",
    description: "Native feed content, UGC-feel, everyday context",
    promptTemplate: `{{product}} photographed on {{surface}} with {{lighting}}, realistic everyday context, authentic social media aesthetic, shot from {{angle}}, amateur-looking but well-composed, natural depth of field, product clearly visible, brand tone: {{tone}}.`,
    negativePrompt:
      "blurry, low-res, watermark, text overlay, distorted product, warped geometry, unnatural composition, overly saturated",
    preferredModel: "nano_banana_2",
    supportedFormats: ["static", "animated_still"],
    aspectRatios: ["9:16", "1:1", "4:5"],
    alternatesCount: { static: 3, motion: 1 },
    qcThresholds: {
      clipScoreMin: 0.28,
      brandColorDeltaEMax: 18,
      faceCountMin: 0,
      faceCountMax: 1,
    },
    referenceKeys: [],
    availableInPreview: true,
    planGate: "base",
  },
  editorial_hero: {
    id: "editorial_hero",
    name: "Editorial Product Hero",
    description: "E-commerce hero, catalog, clean studio look",
    promptTemplate: `{{product}} centered composition on {{background}}, controlled studio lighting, sharp focus on product, details crisp, texture visible, minimal shadow, no models or hands, editorial catalog aesthetic, brand tone: {{tone}}.`,
    negativePrompt:
      "blurry, low-res, watermark, text overlay, people, hands, cluttered background, multiple products",
    preferredModel: "nano_banana_2_hq",
    supportedFormats: ["static", "animated_still"],
    aspectRatios: ["9:16", "1:1", "4:5"],
    alternatesCount: { static: 3, motion: 1 },
    qcThresholds: {
      clipScoreMin: 0.32,
      brandColorDeltaEMax: 12,
      faceCountMin: 0,
      faceCountMax: 0,
    },
    referenceKeys: [],
    availableInPreview: true,
    planGate: "base",
  },
  fashion_campaign: {
    id: "fashion_campaign",
    name: "Fashion Aesthetic Campaign",
    description: "Hero campaign, lookbook, brand mood pieces — Premium only",
    promptTemplate: `{{model_reference}} wearing/using {{product}}, in {{setting}}, fashion photography lighting, composition inspired by {{mood}}, high production value, brand tone: {{tone}}.`,
    negativePrompt:
      "blurry, low-res, watermark, text overlay, distorted face, multiple people, amateur lighting, cluttered",
    preferredModel: "nano_banana_2",
    motionModel: "kling_v2",
    supportedFormats: ["static", "short_motion"],
    aspectRatios: ["9:16", "1:1", "4:5"],
    alternatesCount: { static: 3, motion: 1 },
    qcThresholds: {
      clipScoreMin: 0.3,
      brandColorDeltaEMax: 15,
      faceCountMin: 1,
      faceCountMax: 1,
      faceSimilarityMin: 0.85,
    },
    referenceKeys: [],
    availableInPreview: false,
    planGate: "premium",
  },
  cgi_concept: {
    id: "cgi_concept",
    name: "CGI Concept Environment",
    description: "Viral hooks, eye-catchers, brand stunt content",
    promptTemplate: `{{product}} in hyperreal CGI environment: {{concept}}, giant scale, physics-defying, premium cosmetic product visualization, cinematic lighting, brand tone: {{tone}}.`,
    negativePrompt:
      "blurry, low-res, watermark, text overlay, realistic context, everyday environment",
    preferredModel: "nano_banana_2",
    motionModel: "seedance_v2_pro",
    supportedFormats: ["static", "short_motion"],
    aspectRatios: ["9:16", "1:1", "4:5"],
    alternatesCount: { static: 3, motion: 1 },
    qcThresholds: {
      clipScoreMin: 0.28,
      brandColorDeltaEMax: 20,
      faceCountMin: 0,
      faceCountMax: 0,
    },
    referenceKeys: [],
    availableInPreview: true,
    planGate: "base",
  },
};

export function getPresetsForClient(plan: "base" | "premium"): StylePreset[] {
  return Object.values(STYLE_PRESETS).filter(
    (p) => plan === "premium" || p.planGate === "base",
  );
}

export function getPreviewPresets(): StylePreset[] {
  return Object.values(STYLE_PRESETS).filter((p) => p.availableInPreview);
}
