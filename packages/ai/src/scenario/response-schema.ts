// JSON schema for Vertex responseSchema — mirrors shared/src/schemas/scenario.ts::BrandScenarioSchema
// Kept as a plain object so Vertex can use it directly. Zod validates the parsed output on our end.

const SCENE_VARIANT = {
  type: "object",
  required: [
    "id",
    "headline",
    "surface",
    "lighting",
    "angle",
    "composition",
    "propsOrContext",
  ],
  properties: {
    id: { type: "string" },
    headline: { type: "string" },
    surface: { type: "string" },
    lighting: { type: "string" },
    angle: {
      type: "string",
      enum: ["eye-level", "overhead", "3/4", "side", "low", "hero"],
    },
    composition: {
      type: "string",
      enum: [
        "centered",
        "rule-of-thirds-left",
        "rule-of-thirds-right",
        "negative-space-top",
        "negative-space-bottom",
        "symmetrical",
        "diagonal-dynamic",
      ],
    },
    propsOrContext: { type: "string" },
    referenceAnchor: { type: "string" },
  },
};

export const BRAND_SCENARIO_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  required: [
    "creativeDirection",
    "moodKeywords",
    "surfaceLibrary",
    "lightingTokens",
    "colorGrading",
    "avoidList",
    "sceneVariantsByStyle",
    "recommendedMix",
  ],
  properties: {
    creativeDirection: { type: "string" },
    moodKeywords: {
      type: "array",
      items: { type: "string" },
    },
    surfaceLibrary: {
      type: "array",
      items: { type: "string" },
    },
    lightingTokens: {
      type: "array",
      items: { type: "string" },
    },
    colorGrading: { type: "string" },
    avoidList: {
      type: "array",
      items: { type: "string" },
    },
    sceneVariantsByStyle: {
      type: "object",
      required: ["social_style", "editorial_hero", "cgi_concept"],
      properties: {
        social_style: {
          type: "array",
          items: SCENE_VARIANT,
        },
        editorial_hero: {
          type: "array",
          items: SCENE_VARIANT,
        },
        cgi_concept: {
          type: "array",
          items: SCENE_VARIANT,
        },
        fashion_campaign: {
          type: "array",
          items: SCENE_VARIANT,
        },
      },
    },
    recommendedMix: {
      type: "object",
      required: ["primaryStyle", "secondaryStyle", "reasoning"],
      properties: {
        primaryStyle: {
          type: "string",
          enum: ["social_style", "editorial_hero", "fashion_campaign", "cgi_concept"],
        },
        secondaryStyle: {
          type: "string",
          enum: ["social_style", "editorial_hero", "fashion_campaign", "cgi_concept"],
        },
        reasoning: { type: "string" },
      },
    },
  },
};
