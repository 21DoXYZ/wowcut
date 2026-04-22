import { z } from "zod";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";

export const HeroShotSchema = z.object({
  imageUrl: z.string(),
  brandName: z.string(),
  ctaText: z.string(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export type HeroShotProps = z.infer<typeof HeroShotSchema>;

export const heroShotDefaults: HeroShotProps = {
  imageUrl: "https://placehold.co/1080x1920/111111/ffffff?text=Hero",
  brandName: "Your Brand",
  ctaText: "Shop Now",
  brandColor: "#000000",
};

export const HeroShot: React.FC<HeroShotProps> = ({ imageUrl, brandName, ctaText, brandColor }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 30], [1.04, 1], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Img
        src={imageUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          padding: 80,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "General Sans, -apple-system, sans-serif",
            color: "#fff",
            fontSize: 64,
            fontWeight: 540,
            letterSpacing: "-0.96px",
            lineHeight: 1.05,
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}
        >
          {brandName}
        </div>
        <div style={{ marginTop: 24 }}>
          <span
            style={{
              display: "inline-block",
              backgroundColor: brandColor,
              color: "#fff",
              padding: "14px 28px",
              borderRadius: 50,
              fontFamily: "General Sans, sans-serif",
              fontSize: 20,
              fontWeight: 450,
              letterSpacing: "-0.14px",
            }}
          >
            {ctaText}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
