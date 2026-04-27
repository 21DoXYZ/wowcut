import type { StylePresetId } from "./presets";

export interface StyleTokens {
  opening: string;
  styleTokens: string;
  negative: string;
  qualityClause: string;
  aspectDefault: string;
}

/**
 * Style tokens derived from visual analysis of curated reference images per style.
 *
 * social_style refs:
 *   - Flat lay on green bench with lifestyle props (book, glasses, earphones, perfume)
 *   - Single green tube leaning against paper/marble, cool natural window light
 *   - Crumpled metallic tube close-up, authentic used texture, overhead angle
 * Pattern: natural surfaces (wood, paper, linen, marble), overhead or close-up,
 *   organic lifestyle props, window light with soft shadows, candid imperfection
 *
 * editorial_hero refs:
 *   - Floating/levitating lipstick + dropper on circular platform, blue-grey gradient bg
 *   - 3 foundation bottles lined up on warm pink bg, liquid swatches dripping beneath
 *   - Nail polish surrounded by raspberries + strawberries, liquid dripping from bottle, cream bg
 *   - Soap on mirror surface with orange gerbera flower, open sky reflection
 * Pattern: colored brand-matching backgrounds, liquid texture elements (drips/swatches),
 *   natural props matching product ingredients, reflective surfaces, floating compositions
 *
 * cgi_concept refs:
 *   - Skincare bottle on massive illuminated billboard at city night, water pouring from billboard
 *   - Giant L'Oreal bottle as tall as skyscrapers, low angle, dramatic blue sky
 *   - Dior Sauvage tube emerging from arctic ice wrapped in chains, tanker ship behind
 * Pattern: product at building/city scale, dramatic real-world environments (arctic, city night,
 *   open sky), product as physical monument or event, ultra-photorealistic 3D
 *
 * fashion_campaign refs:
 *   - Model looking upward, hand holds skincare product above face, tight crop, white bg
 *   - Model at dinner table, product (shoe) served on silver platter as "food",
 *     fur coat, candles, silver candlestick — deliberate conceptual staging
 * Pattern: white/neutral studio or intentional conceptual set, model as aspirational figure,
 *   product elevated literally or conceptually, strong art direction concept behind scene
 */

export const STYLE_TOKENS: Record<StylePresetId, StyleTokens> = {
  social_style: {
    opening:
      "Authentic social-media content photography. The shot looks like it was taken by a real content creator — natural, immediate, lived-in. No studio, no seamless backdrop, no professional lights.",
    styleTokens:
      "flat-lay or close-up on natural surface — unbleached linen, cold marble, raw wood plank, crumpled paper bag, outdoor wooden bench, vintage tile. Natural window light from one side casting a soft directional shadow. Lifestyle props scattered nearby: an open paperback, tortoiseshell sunglasses, rolled earbuds, a half-crumpled paper coffee cup, a folded cloth. Overhead angle OR intimate 45-degree close-up. Slight organic imperfection: minor shadows, subtle surface texture, maybe a small crease in the background material. iPhone-quality shallow depth of field on product. No color correction — colours are accurate but unstaged, just natural. Color palette driven by the surface and light rather than stylised grading. Content-creator authenticity, the kind of shot that stops the scroll because it feels real.",
    negative:
      "studio strobe, beauty dish, seamless backdrop, softbox lighting, perfect symmetric lighting, professional catalog setup, multiple different products, hands visibly touching product during hero shot, text overlay, watermark, CGI look, surreal environment, fashion model, skinny retouching, AI plastic skin, symmetric prop arrangement, perfectly colour-graded LUT look",
    qualityClause:
      "sharp focus on the product label and surface, natural color, realistic material texture, film-grain allowed if it adds to authenticity, 4K detail on product",
    aspectDefault: "4:5",
  },

  editorial_hero: {
    opening:
      "Studio editorial product photography. The product is the sole subject. Every element — background colour, surface, props, liquid textures — is chosen to serve the product's visual story. The shot must feel like a double-page beauty spread in Vogue or Harper's Bazaar.",
    styleTokens:
      "flat or curved coloured background matching or complementing the product's dominant hue — warm coral, dusty rose, sky-blue gradient, warm cream, sage green. One of these visual strategies: (A) LINEUP — two or three units of the product standing side-by-side on a matching tone background with liquid swatches or colour-matched texture dripping below each unit; (B) FLOATING — single product levitating with a subtle cast shadow on a gradient background, reflection visible on the surface below; (C) MACRO with INGREDIENTS — extreme close-up of product surrounded by natural ingredients that match its formula (berries, botanicals, citrus, petals) with matching liquid dripping from the product; (D) MIRROR — product placed on a glass or mirror surface with reflected sky or botanical props (flower, branch, leaf) visible in reflection. Controlled soft-box lighting with no harsh shadows. Product label fully legible. No human elements.",
    negative:
      "model, hand, face, person, lifestyle context, candid composition, cluttered background, everyday setting, harsh shadow, low resolution, multiple unrelated products, text overlay, watermark, amateur framing, CGI environment look, busy backdrop",
    qualityClause:
      "razor-sharp product label, surface texture of packaging clearly visible, liquid elements photorealistic, colour grading matches brand palette, catalog-grade 8K clarity",
    aspectDefault: "1:1",
  },

  cgi_concept: {
    opening:
      "Cinematic AI-generated world where the product exists at an impossible, awe-inspiring scale or in a physically impossible environment. The scene is not aspirational lifestyle — it is a visual stunt, a brand moment that stops people mid-scroll because it breaks reality.",
    styleTokens:
      "Choose ONE of these proven concepts from real campaign references: (A) CITY SCALE — the product appears as a colossal structure in a real-world urban environment: as tall as skyscrapers, low-angle shot looking up at the product against dramatic sky or city skyline, volumetric light rays, photorealistic architecture around it; (B) BILLBOARD TAKEOVER — product explodes out of or pours liquid from a massive illuminated billboard in a night city street, city lights reflecting in the wet pavement, product substance (water, cream, liquid) physically interacting with the real environment below; (C) EXTREME ENVIRONMENT — product placed in a dramatic hostile environment (arctic ice, volcanic rock, deep ocean trench, thunderstorm clouds) as if it is a natural force of nature — product wrapped in chains of ice, emerging from cracking glacier, lit by lightning. Ultra-photorealistic 3D rendering, Octane/Redshift render quality, volumetric atmosphere, cinematic 2.39:1 aspect feel, IMAX framing. Product brand and packaging fully legible despite the scale.",
    negative:
      "abstract gradient background, generic AI swirls, boring floating product, studio setting, everyday context, low-budget CGI, cartoon look, plastic material quality, human figure, text overlay, watermark, symmetric safe composition, generic colourful background with particles",
    qualityClause:
      "photorealistic material rendering, volumetric light and atmosphere, product label readable at scale, scene feels like a real moment from a Netflix title sequence, cinematic depth of field",
    aspectDefault: "9:16",
  },

  fashion_campaign: {
    opening:
      "Art-directed fashion campaign. A model and the product are placed together in a deliberate, conceptual scene. The staging has an idea behind it — not just 'model holding product' but a visual statement about the brand.",
    styleTokens:
      "Choose ONE conceptual direction: (A) BEAUTY CLOSE-UP — tight crop, clean white or off-white background, model looking upward or at camera, one hand raised holding the product above or beside the face, strong skin texture, no retouching, raw beauty confidence, product as centrepiece between face and camera; (B) CONCEPTUAL TABLE — model seated at an elegantly staged table or set piece, product placed as if it is a luxury object being 'served' or 'presented' — on a silver tray, inside a glass dome, wrapped as a gift — model dressed in editorial fashion (fur, structured tailoring, vintage accessories), candles or silver props, very deliberate art-direction; (C) MOVEMENT — model in motion (walking, turning, running) with product integrated into wardrobe or held naturally, background is a neutral studio sweep or a simple architectural setting, motion blur on fabric, product sharp. Soft dramatic studio lighting — large diffused source from one side, gentle shadow on opposite side. No harsh strobe. Fashion editorial colour grading: slightly desaturated with lifted blacks.",
    negative:
      "candid snapshot, everyday casual context, multiple different faces, distorted face, plastic AI skin, heavily retouched skin, text overlay, watermark, cluttered unintentional background, UGC feel, amateur composition, generic smiling model, catalogue posture",
    qualityClause:
      "fashion editorial sharpness, skin tone authenticity, fabric and prop texture detail, product crisp and label-legible, scene feels purposefully art-directed by a creative director",
    aspectDefault: "4:5",
  },
};

export const UNIVERSAL_NEGATIVES =
  "low resolution, jpeg artifacts, oversharpened, watermark, logo overlay, text on image, typography, distorted geometry, extra limbs, deformed product, blurry product, out-of-focus label";
