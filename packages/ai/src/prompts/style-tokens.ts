import type { StylePresetId } from "./presets";

export interface StyleTokens {
  opening: string;
  styleTokens: string;
  negative: string;
  qualityClause: string;
  aspectDefault: string;
}

export const STYLE_TOKENS: Record<StylePresetId, StyleTokens> = {
  social_style: {
    opening:
      "Authentic social media photography, shot on modern smartphone with wide aperture.",
    styleTokens:
      "authentic UGC aesthetic, everyday context, amateur-but-well-composed, shallow depth of field, natural imperfection, candid realism, content-creator feel, iPhone 15 Pro camera look, no obvious professional setup",
    negative:
      "studio lighting, seamless backdrop, professional catalog look, multiple products, hands touching product, text overlay, watermark, distorted product geometry, multiple identical products, AI hallucinated extra items, perfect unrealistic lighting, CGI look",
    qualityClause:
      "sharp focus on product, natural color grading, realistic skin tones if present",
    aspectDefault: "4:5",
  },

  editorial_hero: {
    opening:
      "High-end editorial product photography, commercial catalog quality, 85mm lens look.",
    styleTokens:
      "editorial magazine quality, sharp focus on product, texture detail visible, controlled minimal shadow, premium cosmetic advertising aesthetic, Harper's Bazaar beauty section look, no human elements, product is sole subject, meticulous lighting control",
    negative:
      "models, hands, faces, cluttered props, lifestyle context, multiple products, amateur composition, harsh shadow, busy background, motion blur, low resolution, text overlay, CGI render look",
    qualityClause:
      "razor-sharp focus on product, professional color grading, catalog-grade clarity, 8k detail",
    aspectDefault: "1:1",
  },

  cgi_concept: {
    opening:
      "Hyperreal CGI 3D render, premium cosmetic product visualization, cinematic motion graphics aesthetic.",
    styleTokens:
      "giant scale product rendering, premium cosmetic commercial CGI, cinematic lighting with subsurface scattering, Octane render look, physics-defying composition, stop-scroll viral aesthetic, Nike commercial quality, Apple product reveal feel, immersive otherworldly environment, rendered as if photographed, physically accurate material properties",
    negative:
      "realistic everyday setting, human elements, kitchen context, bathroom context, studio seamless, low-budget CGI, cartoonish plastic look, amateur 3D, text overlay, watermark, documentary realism",
    qualityClause:
      "photorealistic material detail, volumetric lighting, cinematic depth of field",
    aspectDefault: "9:16",
  },

  fashion_campaign: {
    opening:
      "High-fashion editorial campaign photography, lookbook-grade production.",
    styleTokens:
      "fashion photography lighting, editorial campaign composition, high production value, magazine-grade color grading, consistent model identity through reference",
    negative:
      "amateur composition, multiple different faces, distorted face, plastic AI skin, text overlay, watermark, cluttered background",
    qualityClause:
      "fashion editorial sharpness, skin-tone fidelity, wardrobe texture detail",
    aspectDefault: "4:5",
  },
};

export const UNIVERSAL_NEGATIVES =
  "low resolution, jpeg artifacts, oversharpened, watermark, logo overlay, text on image, typography, distorted geometry, extra limbs, deformed product";
