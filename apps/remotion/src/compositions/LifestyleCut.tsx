import { z } from "zod";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";

export const LifestyleCutSchema = z.object({
  imageUrl: z.string(),
  quote: z.string(),
});

export type LifestyleCutProps = z.infer<typeof LifestyleCutSchema>;

export const lifestyleDefaults: LifestyleCutProps = {
  imageUrl: "https://placehold.co/1080x1080?text=Lifestyle",
  quote: "Soft on skin, bold on shelf.",
};

export const LifestyleCut: React.FC<LifestyleCutProps> = ({ imageUrl, quote }) => {
  const frame = useCurrentFrame();
  const parallax = interpolate(frame, [0, 150], [0, -40], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#f7f5f0" }}>
      <Img
        src={imageUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translateY(${parallax}px) scale(1.05)`,
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", padding: 80 }}>
        <div
          style={{
            fontFamily: "General Sans, sans-serif",
            color: "#fff",
            fontSize: 48,
            fontWeight: 450,
            letterSpacing: "-0.64px",
            textAlign: "center",
            maxWidth: 800,
            textShadow: "0 2px 14px rgba(0,0,0,0.5)",
          }}
        >
          {quote}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
