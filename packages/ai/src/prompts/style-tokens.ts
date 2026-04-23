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
      "authentic UGC aesthetic, everyday lifestyle context, amateur-but-well-composed, shallow depth of field, natural imperfection, candid realism, content-creator feel, iPhone 15 Pro camera look, no obvious professional setup, organic placement",
    negative:
      "studio lighting, seamless backdrop, professional catalog look, multiple products, hands touching product, text overlay, watermark, distorted product geometry, AI hallucinated extra items, perfect unrealistic lighting, CGI look",
    qualityClause:
      "sharp focus on product, natural color grading, realistic skin tones if present",
    aspectDefault: "4:5",
  },

  editorial_hero: {
    opening:
      "Studio editorial product photography — the product is the sole subject of the frame. All composition, lighting and camera work serve one goal: the most precise and clean reveal of the product's form, design, materials and packaging details.",
    styleTokens:
      "controlled studio environment, minimalist or neutral background, fully managed lighting that emphasises object geometry and surface texture, centered or symmetric composition, packaging details crisp and legible, material finish accurately rendered, no human elements whatsoever — zero models, hands or faces, product physically present as primary focal object, Harper's Bazaar beauty section quality, commercial catalog clarity",
    negative:
      "models, hands, faces, people, lifestyle context, cluttered props, multiple products, amateur composition, harsh uncontrolled shadow, busy background, motion blur, low resolution, text overlay, CGI render look, surreal environment",
    qualityClause:
      "razor-sharp focus on product geometry and packaging, professional color grading, surface texture clearly visible, catalog-grade clarity, 8k detail",
    aspectDefault: "1:1",
  },

  cgi_concept: {
    opening:
      "Fully AI-generated conceptual environment — the scene is not a real location but a visual world built entirely around the product idea. The space may be futuristic, abstract or metaphorical.",
    styleTokens:
      "product placed inside a fully artificial AI-generated world — architectural structures, technological forms, natural abstract shapes or dynamic elements that reveal the product concept, physics-defying composition, scale hyperbole allowed (product can become a gigantic element of the scene), levitation, dissolving into elements, reassembling, interaction with environment in non-standard ways, cinematic lighting with subsurface scattering, Octane render quality, stop-scroll viral aesthetic, Nike commercial energy, Apple product reveal feel, immersive otherworldly atmosphere, photorealistic material properties",
    negative:
      "realistic everyday setting, real-world location, kitchen, bathroom, studio seamless backdrop, human elements, low-budget CGI, cartoonish plastic look, amateur 3D, text overlay, watermark, documentary realism, generic gradient background",
    qualityClause:
      "photorealistic material detail, volumetric lighting, cinematic depth of field, world feels purposefully designed around the product concept",
    aspectDefault: "9:16",
  },

  fashion_campaign: {
    opening:
      "Staged advertising campaign — the product is integrated into a stylized fashion scene with a model or character. Composition, light and props function as a unified artistic system reflecting the brand DNA.",
    styleTokens:
      "fashion campaign photography, model interacting with product, environment and props chosen to express brand DNA and aesthetic direction, dramatic or artistic lighting, fashion shoot principles: pose plasticity, balance of objects in frame, visual expressiveness of space, staged artistic environment (not everyday or candid), product becomes part of the brand's styled visual world, high production value, magazine-grade color grading, consistent model identity, editorial campaign composition",
    negative:
      "candid snapshot, everyday casual context, amateur composition, multiple different faces, distorted face, plastic AI skin, text overlay, watermark, cluttered unintentional background, UGC aesthetic",
    qualityClause:
      "fashion editorial sharpness, skin-tone fidelity, wardrobe and prop texture detail, scene feels purposefully art-directed",
    aspectDefault: "4:5",
  },
};

export const UNIVERSAL_NEGATIVES =
  "low resolution, jpeg artifacts, oversharpened, watermark, logo overlay, text on image, typography, distorted geometry, extra limbs, deformed product";
