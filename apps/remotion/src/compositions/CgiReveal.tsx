import { z } from "zod";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";

export const CgiRevealSchema = z.object({
  imageUrl: z.string(),
  productName: z.string(),
});

export type CgiRevealProps = z.infer<typeof CgiRevealSchema>;

export const cgiDefaults: CgiRevealProps = {
  imageUrl: "https://placehold.co/1080x1920?text=CGI",
  productName: "CGI Moment",
};

export const CgiReveal: React.FC<CgiRevealProps> = ({ imageUrl, productName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 12 } });
  const scale = interpolate(reveal, [0, 1], [1.3, 1]);
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #7A3BFF 0%, #FF4BD4 100%)",
      }}
    >
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Img
          src={imageUrl}
          style={{
            width: "70%",
            borderRadius: 16,
            transform: `scale(${scale})`,
            filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.35))",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", padding: 80, opacity }}>
        <div
          style={{
            color: "#fff",
            fontFamily: "General Sans, sans-serif",
            fontSize: 48,
            fontWeight: 540,
            letterSpacing: "-0.96px",
          }}
        >
          {productName}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
