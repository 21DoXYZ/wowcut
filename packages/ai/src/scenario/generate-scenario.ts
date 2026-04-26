import { z } from "zod";
import { schemas } from "@wowcut/shared";
import { generateStructured, VERTEX_MODELS, type VertexImagePart } from "../vertex";
import { getScenarioSystemPrompt } from "./system-prompt";
import { SCENARIO_FEW_SHOTS } from "./few-shots";
import { BRAND_SCENARIO_RESPONSE_SCHEMA } from "./response-schema";

function padToThree<T>(arr: T[]): [T, T, T] {
  if (arr.length === 0) throw new Error("Scene array is empty");
  const last = arr[arr.length - 1] as T;
  while (arr.length < 3) arr.push(last);
  return arr.slice(0, 3) as [T, T, T];
}

export interface GenerateScenarioInput {
  intake: schemas.BriefIntake;
  productImages: Array<{ mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string }>;
  referenceImages: Array<{ mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string }>;
  selectedStyles?: string[];
}

export interface GenerateScenarioResult {
  scenario: schemas.BrandScenario;
  costUsd: number;
  rawResponse: string;
}

export async function generateScenario(
  input: GenerateScenarioInput,
): Promise<GenerateScenarioResult> {
  const images: VertexImagePart[] = [
    ...input.productImages.map((img, i) => ({
      mediaType: img.mediaType,
      base64: img.data,
      label: `Product ${i + 1}`,
    })),
    ...input.referenceImages.map((img, i) => ({
      mediaType: img.mediaType,
      base64: img.data,
      label: `Reference ${i + 1}`,
    })),
  ];

  const productsDescription = input.intake.products
    .map(
      (p, i) =>
        `Product ${i + 1}: ${p.nameGuess ?? "unnamed"} — category: ${p.category ?? "unknown"}, shape: ${p.shape ?? "unknown"}, material: ${p.material ?? "unknown"}`,
    )
    .join("\n");

  const userText = `BRAND INTAKE:

Brand name: ${input.intake.brandName ?? "(not provided)"}
Brand color: ${input.intake.brandColor}
${input.intake.secondaryColor ? `Secondary color: ${input.intake.secondaryColor}` : ""}

${productsDescription}

References: ${input.intake.references.length} images attached above.

${SCENARIO_FEW_SHOTS}

Now produce the creative direction JSON for THIS brand. Respond with JSON only, strictly matching the schema.`;

  const systemPrompt = getScenarioSystemPrompt(input.selectedStyles);

  const result = await generateStructured({
    model: VERTEX_MODELS.reasoning,
    system: systemPrompt,
    userText,
    images,
    schema: z.unknown(),
    responseSchema: BRAND_SCENARIO_RESPONSE_SCHEMA,
    maxOutputTokens: 8192,
    temperature: 0.75,
  });

  // Normalize scene arrays to exactly 3 items before strict Zod validation.
  // Gemini constrained decoding can't enforce minItems so we pad/trim here.
  const raw = result.data as Record<string, unknown>;
  const svs = raw.sceneVariantsByStyle as Record<string, unknown[]> | undefined;
  if (svs) {
    const REQUIRED = ["social_style", "editorial_hero", "cgi_concept"];
    const ALL = [...REQUIRED, "fashion_campaign"];

    // First pass: pad any style that has at least 1 scene to exactly 3
    for (const key of ALL) {
      if (Array.isArray(svs[key]) && svs[key].length > 0) {
        svs[key] = padToThree(svs[key]);
      }
    }

    // Second pass: fill missing required styles from fallback
    const fallback = (svs.social_style ?? svs.editorial_hero ?? svs.cgi_concept) as unknown[];
    for (const key of REQUIRED) {
      if (!Array.isArray(svs[key]) || (svs[key] as unknown[]).length === 0) {
        if (fallback && fallback.length > 0) {
          svs[key] = padToThree([...fallback]);
        }
      }
    }

    // Third pass: fashion_campaign is optional — if still empty/missing, delete it
    // so Zod sees undefined (passes .optional()) rather than [] (fails .length(3))
    if (!Array.isArray(svs.fashion_campaign) || (svs.fashion_campaign as unknown[]).length === 0) {
      delete svs.fashion_campaign;
    }
  }

  const scenario = schemas.BrandScenarioSchema.parse(raw);
  const costUsd = 0.02;

  return { scenario, rawResponse: result.rawText, costUsd };
}
