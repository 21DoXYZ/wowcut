import { z } from "zod";
import { generateStructured, VERTEX_MODELS, type VertexImagePart } from "./vertex";

const ProductInferenceSchema = z.object({
  nameGuess: z.string().max(80),
  category: z.string().max(40),
  shape: z.string().max(80),
  material: z.string().max(80),
  dominantColor: z.string().max(40),
  accentColors: z.string().max(80),
  texture: z.string().max(80),
  finish: z.string().max(60),
  distinctiveFeatures: z.string().max(200),
  shortDescription: z.string().max(400),
});

export type ProductInference = z.infer<typeof ProductInferenceSchema>;

const RESPONSE_SCHEMA = {
  type: "object",
  required: ["nameGuess", "category", "shape", "material", "dominantColor", "accentColors", "texture", "finish", "distinctiveFeatures", "shortDescription"],
  properties: {
    nameGuess: { type: "string" },
    category: { type: "string" },
    shape: { type: "string" },
    material: { type: "string" },
    dominantColor: { type: "string" },
    accentColors: { type: "string" },
    texture: { type: "string" },
    finish: { type: "string" },
    distinctiveFeatures: { type: "string" },
    shortDescription: { type: "string" },
  },
};

const SYSTEM = `You are a product analyst for a creative AI tool.
Look at the product image and extract details for use in image generation prompts.
Be specific and descriptive. Use plain English, not marketing speak.
Output JSON only.`;

export async function inferProductFromImage(image: {
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  data: string;
}): Promise<ProductInference> {
  try {
    const img: VertexImagePart = { mediaType: image.mediaType, base64: image.data };
    const result = await generateStructured({
      model: VERTEX_MODELS.vision,
      system: SYSTEM,
      userText: `Analyze this product image carefully. Return JSON with ALL fields — this data is used verbatim in AI image generation prompts, so be precise and visual:

- nameGuess: exact product name (e.g. "white linen button-down shirt", "amber glass serum dropper bottle", "speckled ceramic coffee mug")
- category: product category (e.g. "apparel", "homeware", "beauty", "food", "accessories", "footwear", "electronics")
- shape: detailed physical shape (e.g. "tall 200ml cylindrical bottle with tapered neck", "folded shirt showing collar detail and sleeve cuffs", "wide-mouth cylindrical mug with C-shaped handle")
- material: primary material with visual properties (e.g. "lightweight linen cotton weave with visible thread texture", "amber borosilicate glass with metal pump cap", "handmade stoneware with reactive glaze")
- dominantColor: the dominant color in precise terms (e.g. "off-white", "warm ivory", "forest green", "dusty rose")
- accentColors: secondary colors visible on the product (e.g. "gold metal accents", "navy stitching", "clear glass cap") — write "none" if single-color
- texture: surface texture description (e.g. "matte soft-touch finish", "natural woven linen grain", "brushed metal", "speckled ceramic glaze", "smooth glossy glass")
- finish: surface sheen (e.g. "matte", "glossy", "satin", "metallic", "frosted", "natural raw")
- distinctiveFeatures: unique design details that make this product identifiable (e.g. "embossed logo on bottle shoulder", "pearlescent buttons", "hand-painted pattern", "minimalist label with serif typography") — max 200 chars
- shortDescription: write a precise 2-3 sentence prompt-ready description of the product as if guiding an image model that cannot see the image. Include color, material, shape, texture, finish, and distinctive details. Be visual and specific, not generic.`,
      images: [img],
      schema: ProductInferenceSchema,
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 512,
      temperature: 0.2,
    });
    return result.data;
  } catch (err) {
    console.error("[infer-product] failed", (err as Error).message);
    return {
      nameGuess: "product",
      category: "product",
      shape: "compact form",
      material: "smooth surface",
      dominantColor: "neutral",
      accentColors: "none",
      texture: "smooth",
      finish: "matte",
      distinctiveFeatures: "none",
      shortDescription: "A product with smooth surfaces and neutral tones. Clean minimal design.",
    };
  }
}
