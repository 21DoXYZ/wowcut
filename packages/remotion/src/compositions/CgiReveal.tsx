import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

export const CgiRevealSchema = z.object({
  imageUrl: z.string(),
  productName: z.string(),
});

export type CgiRevealProps = z.infer<typeof CgiRevealSchema>;

// 9:16 — 1080×1920 — 30fps — 6s = 180 frames
export const CGI_REVEAL_CONFIG = {
  id: "CgiReveal",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 180,
} as const;

function SplitText({ text, frame, fps, startFrame }: { text: string; frame: number; fps: number; startFrame: number }) {
  const words = text.split(" ");
  return (
    <span>
      {words.map((word, i) => {
        const wordSpring = spring({
          frame: frame - startFrame - i * 4,
          fps,
          config: { stiffness: 140, damping: 20 },
        });
        const opacity = interpolate(wordSpring, [0, 1], [0, 1]);
        const translateY = interpolate(wordSpring, [0, 1], [24, 0]);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity,
              transform: `translateY(${translateY}px)`,
              marginRight: "0.28em",
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}

export function CgiReveal({ imageUrl, productName }: CgiRevealProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // cinematic pull-back: start zoomed in, pull out
  const scale = interpolate(frame, [0, durationInFrames], [1.18, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // vignette / dark overlay comes in early
  const vignetteOpacity = interpolate(frame, [0, 30, durationInFrames - 30, durationInFrames], [0, 0.55, 0.55, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // white flash at start
  const flashOpacity = interpolate(frame, [0, 8, 20], [0.6, 0, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // title fades in at frame 40
  const titleSpring = spring({ frame: frame - 40, fps, config: { stiffness: 90, damping: 18 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleScale = interpolate(titleSpring, [0, 1], [0.95, 1]);

  // fade out at end
  const exitOpacity = interpolate(frame, [durationInFrames - 20, durationInFrames - 4], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: exitOpacity }}>
      {/* hero image with pull-back */}
      <AbsoluteFill>
        <Img
          src={imageUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        />
      </AbsoluteFill>

      {/* vignette overlay */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.9) 100%)",
          opacity: vignetteOpacity,
        }}
      />

      {/* cinematic letterbox bars */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "#000" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "#000" }} />

      {/* product name */}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: 0,
          right: 0,
          padding: "0 60px",
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          transformOrigin: "center bottom",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#ffffff",
            fontSize: 56,
            fontWeight: 600,
            fontFamily: "General Sans, -apple-system, sans-serif",
            letterSpacing: "-1px",
            lineHeight: 1.1,
            textAlign: "center",
          }}
        >
          <SplitText text={productName} frame={frame} fps={fps} startFrame={40} />
        </p>
      </div>

      {/* flash */}
      <AbsoluteFill style={{ background: "#ffffff", opacity: flashOpacity, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
}
