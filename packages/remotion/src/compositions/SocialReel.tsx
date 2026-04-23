import { AbsoluteFill, useVideoConfig } from "remotion";
import { z } from "zod";
import { CrossFadeImage } from "../components/CrossFadeImage";
import { AnimatedCaption } from "../components/AnimatedCaption";
import { BrandTag } from "../components/BrandTag";
import { ProgressDots } from "../components/ProgressDots";

export const SocialReelSchema = z.object({
  images: z.array(z.string()).min(1).max(3),
  caption: z.string(),
  brandColor: z.string().default("#86FF6B"),
  brandName: z.string().optional(),
});

export type SocialReelProps = z.infer<typeof SocialReelSchema>;

// 9:16 — 1080×1920 — 30fps — 9s = 270 frames
export const SOCIAL_REEL_CONFIG = {
  id: "SocialReel",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 270,
} as const;

export function SocialReel({ images, caption, brandColor, brandName }: SocialReelProps) {
  const HOLD = 70;
  const FADE = 20;

  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      <CrossFadeImage images={images} holdFrames={HOLD} fadeFrames={FADE} scale={1.06} />

      {/* top brand accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: brandColor,
        }}
      />

      {brandName && <BrandTag brandName={brandName} brandColor={brandColor} />}

      <ProgressDots
        count={images.length}
        holdFrames={HOLD}
        fadeFrames={FADE}
        brandColor={brandColor}
      />

      <AnimatedCaption text={caption} brandColor={brandColor} delayFrames={24} />
    </AbsoluteFill>
  );
}
