import {
  AbsoluteFill,
  Series,
  Video,
  Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

/**
 * AiconStitch — concatenates Veo-rendered scene clips into one vertical video.
 *
 * Each scene has its own clip (videoUrl) and target on-screen duration (durationS).
 * If the source clip is longer than durationS we trim; if shorter, we hold the
 * last frame via Remotion's natural padding (the <Series.Sequence> determines
 * how long each segment is shown regardless of underlying media length).
 *
 * Caption (voiceover field on the scene) fades in/out per segment.
 *
 * The composition uses `calculateMetadata` so the timeline length matches the
 * sum of scene durations dynamically.
 */

export const AiconSceneClipSchema = z.object({
  videoUrl: z.string().url(),
  durationS: z.number().int().min(1).max(60),
  caption: z.string().optional(),
});

export const AiconStitchSchema = z.object({
  scenes: z.array(AiconSceneClipSchema).min(1).max(20),
  audioUrl: z.string().url().optional(),
});

export type AiconStitchProps = z.infer<typeof AiconStitchSchema>;

export const AICON_STITCH_CONFIG = {
  id: "AiconStitch",
  width: 1080,
  height: 1920,
  fps: 30,
  // Placeholder; calculateMetadata overrides per-render.
  durationInFrames: 30 * 30,
} as const;

export function AiconStitch({ scenes, audioUrl }: AiconStitchProps) {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Series>
        {scenes.map((scene, i) => {
          const frames = Math.max(1, Math.round(scene.durationS * fps));
          return (
            <Series.Sequence key={i} durationInFrames={frames}>
              <SceneClip videoUrl={scene.videoUrl} caption={scene.caption} durationFrames={frames} />
            </Series.Sequence>
          );
        })}
      </Series>
      {audioUrl ? <Audio src={audioUrl} /> : null}
    </AbsoluteFill>
  );
}

function SceneClip({
  videoUrl,
  caption,
  durationFrames,
}: {
  videoUrl: string;
  caption: string | undefined;
  durationFrames: number;
}) {
  const frame = useCurrentFrame();

  // Cross-fade in/out at the segment boundaries (last 6 frames).
  const FADE = 6;
  const opacity = interpolate(
    frame,
    [0, FADE, durationFrames - FADE, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Caption fades in over first 8 frames, holds, fades out at end.
  const CAPTION_IN = 8;
  const captionOpacity = interpolate(
    frame,
    [0, CAPTION_IN, durationFrames - CAPTION_IN, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      <Video
        src={videoUrl}
        muted
        // Loop in case the supplied clip is shorter than the segment slot.
        loop
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 140,
            display: "flex",
            justifyContent: "center",
            padding: "0 60px",
            opacity: captionOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 56,
              lineHeight: 1.15,
              color: "#fff",
              textAlign: "center",
              textShadow: "0 4px 24px rgba(0,0,0,0.7)",
              maxWidth: 920,
            }}
          >
            {caption}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
