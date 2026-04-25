import { z } from "zod";
import { generateStructured, VERTEX_MODELS, type VertexImagePart } from "./vertex";

const ProductInferenceSchema = z.object({
  nameGuess: z.string().max(80),
  category: z.string().max(40),
  shape: z.string().max(40),
  material: z.string().max(40),
  dominantColor: z.string().max(20),
  shortDescription: z.string().max(200),
});

export type ProductInference = z.infer<typeof ProductInferenceSchema>;

const RESPONSE_SCHEMA = {
  type: "object",
  required: ["nameGuess", "category", "shape", "material", "dominantColor", "shortDescription"],
  properties: {
    nameGuess: { type: "string" },
    category: { type: "string" },
    shape: { type: "string" },
    material: { type: "string" },
    dominantColor: { type: "string" },
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
      userText: `Analyze this product image and return JSON with:
- nameGuess: common name for the product (e.g. "white button-down shirt", "ceramic mug", "skincare serum bottle")
- category: product category (e.g. "apparel", "homeware", "beauty", "food", "accessories")
- shape: physical shape descriptor (e.g. "tall cylindrical bottle", "flat folded garment", "rectangular box")
- material: primary material or texture (e.g. "cotton fabric", "glass", "matte plastic", "leather")
- dominantColor: the most prominent color in plain English (e.g. "white", "navy blue", "sage green", "black")
- shortDescription: 1-2 sentence description for an image generation prompt (e.g. "A white linen button-down shirt with subtle texture, neatly folded showing collar and cuffs.")`,
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
      shape: "compact",
      material: "smooth",
      dominantColor: "neutral",
      shortDescription: "A product shot.",
    };
  }
}
