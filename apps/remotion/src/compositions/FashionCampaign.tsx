import { z } from "zod";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";

export const FashionCampaignSchema = z.object({
  images: z.array(z.string()).min(1).max(6),
  brandName: z.string(),
  ctaText: z.string(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export type FashionCampaignProps = z.infer<typeof FashionCampaignSchema>;

export const fashionDefaults: FashionCampaignProps = {
  images: [
    "https://placehold.co/1080x1350/0a0a0a/ffffff?text=I",
    "https://placehold.co/1080x1350/111111/ffffff?text=II",
    "https://placehold.co/1080x1350/1a1a1a/ffffff?text=III",
  ],
  brandName: "WOWCUT",
  ctaText: "Shop Now",
  brandColor: "#FF2D55",
};

const FRAMES_PER_SLIDE = 65;
const TRANSITION = 20;

export const FashionCampaign: React.FC<FashionCampaignProps> = ({
  images,
  brandName,
  ctaText,
  brandColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaSpring = spring({
    frame: Math.max(0, frame - (images.length * FRAMES_PER_SLIDE - 40)),
    fps,
    config: { damping: 14, stiffness: 180 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#050505", overflow: "hidden" }}>
      {images.map((src, i) => {
        const start = i * FRAMES_PER_SLIDE;
        const local = frame - start;

        // Dramatic: slide in from right, exit left
        const enterX = interpolate(local, [0, TRANSITION], [120, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const exitX = interpolate(
          local,
          [FRAMES_PER_SLIDE - TRANSITION, FRAMES_PER_SLIDE],
          [0, -120],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const translateX = local < FRAMES_PER_SLIDE - TRANSITION ? enterX : exitX;

        const opacity =
          local < TRANSITION
            ? interpolate(local, [0, TRANSITION], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
            : local > FRAMES_PER_SLIDE - TRANSITION
              ? interpolate(local, [FRAMES_PER_SLIDE - TRANSITION, FRAMES_PER_SLIDE], [1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 1;

        // Ken Burns: slow zoom
        const scale = interpolate(local, [0, FRAMES_PER_SLIDE], [1.0, 1.07], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <Sequence key={i} from={start} durationInFrames={FRAMES_PER_SLIDE + TRANSITION}>
            <AbsoluteFill
              style={{
                opacity,
                transform: `translateX(${translateX}px)`,
              }}
            >
              <Img
                src={src}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${scale})`,
                }}
              />
              {/* Vignette */}
              <AbsoluteFill
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
                  pointerEvents: "none",
                }}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* Brand name — top left, always visible */}
      <AbsoluteFill
        style={{
          alignItems: "flex-start",
          justifyContent: "flex-start",
          padding: "52px 56px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "-apple-system, 'General Sans', sans-serif",
            color: "#fff",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "3.5px",
            textTransform: "uppercase",
            opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {brandName}
        </div>
      </AbsoluteFill>

      {/* CTA — appears on last section */}
      <AbsoluteFill
        style={{
          alignItems: "flex-end",
          justifyContent: "flex-end",
          padding: "0 56px 72px",
          pointerEvents: "none",
          opacity: ctaSpring,
          transform: `translateY(${interpolate(ctaSpring, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: "-apple-system, 'General Sans', sans-serif",
              color: "#fff",
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: "-0.2px",
            }}
          >
            {ctaText}
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: brandColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7h10M8 3l4 4-4 4"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
