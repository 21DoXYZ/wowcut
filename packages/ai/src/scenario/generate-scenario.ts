import { schemas } from "@wowcut/shared";
import { generateStructured, VERTEX_MODELS, type VertexImagePart } from "../vertex";
import { getScenarioSystemPrompt } from "./system-prompt";
import { SCENARIO_FEW_SHOTS } from "./few-shots";
import { BRAND_SCENARIO_RESPONSE_SCHEMA } from "./response-schema";

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
    schema: schemas.BrandScenarioSchema,
    responseSchema: BRAND_SCENARIO_RESPONSE_SCHEMA,
    maxOutputTokens: 8192,
    temperature: 0.75,
  });

  // Cost estimate — cached system + few-shots mostly hit prompt cache; rough
  // envelope: 4000 input + 1500 output at Gemini 2.5 Pro prices.
  const costUsd = 0.02;

  return { scenario: result.data, rawResponse: result.rawText, costUsd };
}
