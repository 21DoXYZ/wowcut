import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { CrossFadeImage } from "../components/CrossFadeImage";
import { BrandTag } from "../components/BrandTag";

export const FashionCampaignSchema = z.object({
  images: z.array(z.string()).min(1).max(3),
  brandName: z.string(),
  brandColor: z.string().default("#ffffff"),
  ctaText: z.string().default("Shop now"),
});

export type FashionCampaignProps = z.infer<typeof FashionCampaignSchema>;

// 4:5 — 1080×1350 — 30fps — 9s = 270 frames
export const FASHION_CAMPAIGN_CONFIG = {
  id: "FashionCampaign",
  width: 1080,
  height: 1350,
  fps: 30,
  durationInFrames: 270,
} as const;

export function FashionCampaign({ images, brandName, brandColor, ctaText }: FashionCampaignProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // CTA slides up from bottom late in the sequence
  const ctaSpring = spring({ frame: frame - 90, fps, config: { stiffness: 80, damping: 22 } });
  const ctaTranslate = interpolate(ctaSpring, [0, 1], [60, 0]);
  const ctaOpacity = interpolate(ctaSpring, [0, 1], [0, 1]);

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames - 4],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: "#0a0a0a", opacity: exitOpacity }}>
      {/* full-bleed images, slow elegant fades */}
      <CrossFadeImage images={images} holdFrames={80} fadeFrames={30} scale={1.03} />

      {/* dramatic gradient top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 280,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)",
        }}
      />

      {/* dramatic gradient bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 320,
          background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
        }}
      />

      {/* brand tag top-left */}
      <BrandTag brandName={brandName} brandColor={brandColor} position="top-left" />

      {/* CTA block bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          padding: "0 52px",
          opacity: ctaOpacity,
          transform: `translateY(${ctaTranslate}px)`,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#ffffff",
            fontSize: 44,
            fontWeight: 560,
            fontFamily: "General Sans, -apple-system, sans-serif",
            letterSpacing: "-0.8px",
            lineHeight: 1.15,
            maxWidth: "80%",
          }}
        >
          {brandName}
        </p>

        {/* pill CTA */}
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            alignItems: "center",
            gap: 12,
            background: brandColor,
            color: "#000000",
            padding: "18px 36px",
            borderRadius: 999,
            fontSize: 22,
            fontWeight: 560,
            fontFamily: "General Sans, -apple-system, sans-serif",
            letterSpacing: "-0.2px",
          }}
        >
          {ctaText}
          <span style={{ fontSize: 20 }}>→</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
