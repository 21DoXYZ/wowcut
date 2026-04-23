import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { CrossFadeImage } from "../components/CrossFadeImage";

export const EditorialShowcaseSchema = z.object({
  images: z.array(z.string()).min(1).max(3),
  productName: z.string(),
  brandColor: z.string().default("#000000"),
  caption: z.string().optional(),
});

export type EditorialShowcaseProps = z.infer<typeof EditorialShowcaseSchema>;

// 1:1 — 1080×1080 — 30fps — 7s = 210 frames
export const EDITORIAL_SHOWCASE_CONFIG = {
  id: "EditorialShowcase",
  width: 1080,
  height: 1080,
  fps: 30,
  durationInFrames: 210,
} as const;

export function EditorialShowcase({ images, productName, brandColor, caption }: EditorialShowcaseProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const revealSpring = spring({ frame, fps, config: { stiffness: 80, damping: 22 } });

  const overlayOpacity = interpolate(
    frame,
    [durationInFrames - 40, durationInFrames - 10],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const textSlide = interpolate(revealSpring, [0, 1], [30, 0]);
  const textOpacity = interpolate(revealSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#f5f0eb" }}>
      {/* image takes 80% height, centered */}
      <div style={{ position: "absolute", inset: 0, bottom: 160 }}>
        <CrossFadeImage images={images} holdFrames={60} fadeFrames={25} scale={1.03} />
      </div>

      {/* clean bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 160,
          background: "#f5f0eb",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 52px",
          gap: 8,
          opacity: overlayOpacity,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 24, height: 2, background: brandColor }} />
          <span
            style={{
              fontFamily: "General Sans, -apple-system, sans-serif",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "rgba(0,0,0,0.45)",
            }}
          >
            {caption ?? "Product"}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: "General Sans, -apple-system, sans-serif",
            fontSize: 36,
            fontWeight: 540,
            letterSpacing: "-0.8px",
            color: "#000000",
            transform: `translateY(${textSlide}px)`,
            opacity: textOpacity,
          }}
        >
          {productName}
        </p>
      </div>

      {/* top hairline in brand color */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 52,
          right: 52,
          height: 2,
          background: brandColor,
          opacity: 0.85,
        }}
      />
    </AbsoluteFill>
  );
}
