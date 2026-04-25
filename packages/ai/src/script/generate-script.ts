import { z } from "zod";
import { generateStructured, VERTEX_MODELS } from "../vertex";
import type { ReferenceAnalysis } from "../reference/analyze-video";

export const SceneScriptSchema = z.object({
  index: z.number().int().min(0),
  title: z.string().max(60),
  action: z.string().max(300),   // what happens visually
  voiceover: z.string().max(200).optional(), // text overlay / caption
  durationS: z.number().int().min(2).max(30), // seconds for this scene
});

export const VideoScriptSchema = z.object({
  hook: z.string().max(120),      // opening hook sentence
  scenes: z.array(SceneScriptSchema).min(3).max(12),
  totalDuration: z.number().int(),
});

export type SceneScript = z.infer<typeof SceneScriptSchema>;
export type VideoScript = z.infer<typeof VideoScriptSchema>;

const DURATION_SCENE_MAP: Record<string, { scenes: number; secEach: number }> = {
  s15: { scenes: 4,  secEach: 3  },
  s30: { scenes: 6,  secEach: 5  },
  s60: { scenes: 8,  secEach: 7  },
};

const RESPONSE_SCHEMA = {
  type: "object",
  required: ["hook", "scenes", "totalDuration"],
  properties: {
    hook: { type: "string" },
    totalDuration: { type: "number" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        required: ["index", "title", "action", "durationS"],
        properties: {
          index:     { type: "number" },
          title:     { type: "string" },
          action:    { type: "string" },
          voiceover: { type: "string" },
          durationS: { type: "number" },
        },
      },
    },
  },
};

const SYSTEM = `You are a viral short-form video director specialising in satisfying,
high-retention content — restorations, process videos, transformations, ASMR crafts.
You write tight, punchy scripts where every second earns its place.
Output JSON only. Durations must sum exactly to the requested total.`;

export async function generateVideoScript(
  topic: string,
  duration: "s15" | "s30" | "s60",
  reference?: ReferenceAnalysis | null,
): Promise<VideoScript> {
  const { scenes, secEach } = DURATION_SCENE_MAP[duration]!;
  const totalSeconds = parseInt(duration.replace("s", ""));

  const referenceBlock = reference
    ? `

REFERENCE STYLE (mimic the rhythm, pacing and visual language — NOT the literal content):
- Content type: ${reference.contentType}
- Pacing: ${reference.pacing}
- Mood: ${reference.mood}
- Color grading: ${reference.colorGrading}
- Transitions: ${reference.transitionStyle}
- Camera: ${reference.cameraStyle}
- Hook pattern: ${reference.hook}
- Style guidance: ${reference.styleSummary}
- Reference scene flow: ${reference.scenes.map((s) => `(${s.approxDurationS}s) ${s.description}`).join(" → ")}`
    : "";

  const result = await generateStructured({
    model: VERTEX_MODELS.vision, // gemini-2.5-flash — fast + cheap
    system: SYSTEM,
    userText: `Topic: "${topic}"
Total duration: ${totalSeconds} seconds
Target scenes: ${scenes} (roughly ${secEach}s each)${referenceBlock}

Write a scene-by-scene script for a satisfying, viral short-form video.
Each scene has:
- index (0-based)
- title (short label, e.g. "Before reveal" or "Sanding the frame")
- action (what the camera shows — vivid, visual language, present tense)
- voiceover (optional on-screen text or caption — keep it punchy, under 10 words, or omit)
- durationS (seconds for this scene)

Make it feel like a satisfying timelapse or process video. Hook must grab in first 2 seconds.
Durations must sum to exactly ${totalSeconds}.`,
    schema: VideoScriptSchema,
    responseSchema: RESPONSE_SCHEMA,
    maxOutputTokens: 1024,
    temperature: 0.8,
  });

  return result.data;
}
