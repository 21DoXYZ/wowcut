import { z } from "zod";
import { generateStructured, VERTEX_MODELS } from "../vertex";
import type { SceneScript } from "./generate-script";

export const SceneVisualSchema = z.object({
  shotType: z.enum(["close_up", "wide", "medium", "overhead", "pov", "tracking"]),
  visualDescription: z.string().max(400),
  imagePrompt: z.string().max(600), // ready to send to Imagen 3
  negativePrompt: z.string().max(300).optional(),
});

export type SceneVisual = z.infer<typeof SceneVisualSchema>;

const RESPONSE_SCHEMA = {
  type: "object",
  required: ["shotType", "visualDescription", "imagePrompt"],
  properties: {
    shotType:           { type: "string" },
    visualDescription:  { type: "string" },
    imagePrompt:        { type: "string" },
    negativePrompt:     { type: "string" },
  },
};

const SYSTEM = `You are a cinematographer and AI image director.
Convert a scene description into:
1. A shot type and visual description
2. A detailed Imagen 3 prompt that will generate a stunning keyframe for this scene

Style: photorealistic, cinematic, high production value, satisfying aesthetic.
Prompts should be specific about lighting, texture, camera angle, color grading.
Output JSON only.`;

export async function generateSceneVisual(
  topic: string,
  scene: SceneScript,
  totalScenes: number,
): Promise<SceneVisual> {
  const result = await generateStructured({
    model: VERTEX_MODELS.lite, // gemini-2.5-flash-lite — cheap for storyboard
    system: SYSTEM,
    userText: `Video topic: "${topic}"
Scene ${scene.index + 1} of ${totalScenes}: "${scene.title}"
Action: ${scene.action}
${scene.voiceover ? `On-screen text: "${scene.voiceover}"` : ""}
Scene duration: ${scene.durationS}s

Generate a cinematic keyframe for this scene.
Pick the best shot type and write a detailed Imagen 3 prompt.
The prompt should describe: subject + action + camera angle + lighting + texture + color tone.
Keep it photorealistic. No text or typography in the image.`,
    schema: SceneVisualSchema,
    responseSchema: RESPONSE_SCHEMA,
    maxOutputTokens: 512,
    temperature: 0.6,
  });

  return result.data;
}

export async function generateAllSceneVisuals(
  topic: string,
  scenes: SceneScript[],
): Promise<SceneVisual[]> {
  // Generate in parallel — each call is cheap (flash-lite)
  return Promise.all(
    scenes.map((scene) => generateSceneVisual(topic, scene, scenes.length)),
  );
}
