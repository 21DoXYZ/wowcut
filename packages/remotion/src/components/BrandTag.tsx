import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  brandName: string;
  brandColor: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export function BrandTag({ brandName, brandColor, position = "top-left" }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({ frame, fps, config: { stiffness: 100, damping: 18 } });
  const opacity = interpolate(appear, [0, 1], [0, 1]);
  const translateY = interpolate(appear, [0, 1], [-16, 0]);

  const isTop = position.startsWith("top");
  const isLeft = position.endsWith("left");

  return (
    <div
      style={{
        position: "absolute",
        top: isTop ? 44 : undefined,
        bottom: isTop ? undefined : 44,
        left: isLeft ? 40 : undefined,
        right: isLeft ? undefined : 40,
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: brandColor }} />
      <span
        style={{
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 500,
          fontFamily: "General Sans, -apple-system, sans-serif",
          letterSpacing: "0.4px",
          textTransform: "uppercase",
        }}
      >
        {brandName}
      </span>
    </div>
  );
}
