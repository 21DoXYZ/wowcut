import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  text: string;
  brandColor: string;
  delayFrames?: number;
  position?: "top" | "bottom";
}

export function AnimatedCaption({ text, brandColor, delayFrames = 20, position = "bottom" }: Props) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const slideIn = spring({ frame: frame - delayFrames, fps, config: { stiffness: 120, damping: 20 } });
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames - 10], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(slideIn, [0, 1], [40, 0]);

  return (
    <div
      style={{
        position: "absolute",
        [position]: 0,
        left: 0,
        right: 0,
        padding: "48px 40px",
        background:
          position === "bottom"
            ? "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, transparent 100%)",
        opacity: fadeOut,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 3,
          background: brandColor,
          borderRadius: 2,
          marginBottom: 14,
        }}
      />
      <p
        style={{
          margin: 0,
          color: "#ffffff",
          fontSize: 34,
          fontWeight: 600,
          fontFamily: "General Sans, -apple-system, sans-serif",
          letterSpacing: "-0.5px",
          lineHeight: 1.2,
          maxWidth: "90%",
        }}
      >
        {text}
      </p>
    </div>
  );
}
