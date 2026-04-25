import { z } from "zod";
import { VERTEX_MODELS } from "../vertex";
import { getVertex } from "../vertex/client";
import type { ScrapedReference } from "./scrape-reference";

export const ReferenceAnalysisSchema = z.object({
  hook: z.string().max(200),                 // what grabs attention in the first 2s
  pacing: z.enum(["slow", "medium", "fast", "very_fast"]),
  mood: z.string().max(120),                  // overall feel: cosy, satisfying, dramatic, ASMR…
  colorGrading: z.string().max(120),          // warm filmic, cool clinical, high-contrast…
  transitionStyle: z.string().max(120),       // hard cuts, match cuts, whip pans, dissolves…
  cameraStyle: z.string().max(120),           // static tripod, handheld, drone, macro
  contentType: z.string().max(80),            // "restoration timelapse", "dog grooming", "ASMR craft"
  scenes: z
    .array(
      z.object({
        index: z.number().int().min(0),
        description: z.string().max(240),
        approxDurationS: z.number().int().min(1).max(60),
      }),
    )
    .min(1)
    .max(20),
  totalScenes: z.number().int(),
  styleSummary: z.string().max(500),          // 2-3 sentence guidance for our director
});

export type ReferenceAnalysis = z.infer<typeof ReferenceAnalysisSchema>;

const RESPONSE_SCHEMA = {
  type: "object",
  required: [
    "hook", "pacing", "mood", "colorGrading", "transitionStyle",
    "cameraStyle", "contentType", "scenes", "totalScenes", "styleSummary",
  ],
  properties: {
    hook: { type: "string" },
    pacing: { type: "string", enum: ["slow", "medium", "fast", "very_fast"] },
    mood: { type: "string" },
    colorGrading: { type: "string" },
    transitionStyle: { type: "string" },
    cameraStyle: { type: "string" },
    contentType: { type: "string" },
    totalScenes: { type: "number" },
    styleSummary: { type: "string" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        required: ["index", "description", "approxDurationS"],
        properties: {
          index: { type: "number" },
          description: { type: "string" },
          approxDurationS: { type: "number" },
        },
      },
    },
  },
};

const SYSTEM = `You are a senior video editor analysing reference clips for a viral
short-form content studio. Watch the input carefully and break it down so a
director can recreate the *style* (not the literal content) for a different topic.
Be concrete: name pacing, colour, cut style, camera language. Output JSON only.`;

// Gemini's hard cap is 20 MB *base64-encoded* on the wire (~33% overhead from
// the binary). Stay under ~14 MB raw so the encoded payload fits comfortably.
const MAX_INLINE_BYTES = 14 * 1024 * 1024;

async function fetchVideoBytes(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_INLINE_BYTES) return null; // too big for inline; caller falls back to metadata-only
    const mimeType = res.headers.get("content-type") ?? "video/mp4";
    return { base64: buf.toString("base64"), mimeType };
  } catch {
    return null;
  }
}

async function fetchImageBytes(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const mimeType = res.headers.get("content-type") ?? "image/jpeg";
    return { base64: buf.toString("base64"), mimeType };
  } catch {
    return null;
  }
}

export async function analyzeReferenceVideo(
  ref: ScrapedReference,
): Promise<ReferenceAnalysis> {
  const parts: Array<Record<string, unknown>> = [];

  // 1. Try the actual video. If too large or unreachable, fall back to thumbnail.
  let usedVideo = false;
  if (ref.videoUrl) {
    const v = await fetchVideoBytes(ref.videoUrl);
    if (v) {
      parts.push({ inlineData: { mimeType: v.mimeType, data: v.base64 } });
      usedVideo = true;
    }
  }
  if (!usedVideo && ref.thumbnailUrl) {
    const t = await fetchImageBytes(ref.thumbnailUrl);
    if (t) parts.push({ inlineData: { mimeType: t.mimeType, data: t.base64 } });
  }

  const meta = [
    `Platform: ${ref.platform}`,
    ref.author ? `Author: ${ref.author}` : null,
    ref.caption ? `Caption: ${ref.caption}` : null,
    ref.durationSec ? `Duration: ${ref.durationSec}s` : null,
    ref.viewCount ? `Views: ${ref.viewCount}` : null,
  ].filter(Boolean).join("\n");

  parts.push({
    text: `${meta}\n\n${usedVideo
      ? "Watch the clip end-to-end and describe its style for a director who must remake it on a different topic."
      : "Only a thumbnail/cover image was available. Infer style cues from the frame plus metadata, and admit uncertainty in styleSummary if needed."
    }

Return JSON with:
- hook: what grabs attention in the first 2 seconds
- pacing: slow | medium | fast | very_fast
- mood, colorGrading, transitionStyle, cameraStyle: short concrete phrases
- contentType: short label (e.g. "car restoration timelapse", "dog grooming ASMR")
- scenes: ordered breakdown (index, description, approxDurationS)
- totalScenes: number
- styleSummary: 2-3 sentences a director would actually use as guidance.`,
  });

  const ai = getVertex();
  const response = await ai.models.generateContent({
    model: VERTEX_MODELS.reasoning, // gemini-2.5-pro for best video understanding
    contents: [{ role: "user", parts: parts as never }],
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA as never,
      maxOutputTokens: 2048,
      temperature: 0.4,
    },
  });

  const rawText = response.text ?? "";
  const parsed = JSON.parse(rawText);
  return ReferenceAnalysisSchema.parse(parsed);
}

