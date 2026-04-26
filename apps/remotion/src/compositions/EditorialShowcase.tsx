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

export const EditorialShowcaseSchema = z.object({
  images: z.array(z.string()).min(1).max(6),
  productName: z.string(),
  caption: z.string(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export type EditorialShowcaseProps = z.infer<typeof EditorialShowcaseSchema>;

export const editorialDefaults: EditorialShowcaseProps = {
  images: [
    "https://placehold.co/1080x1080/f5f5f5/111111?text=01",
    "https://placehold.co/1080x1080/eeeeee/111111?text=02",
    "https://placehold.co/1080x1080/e0e0e0/111111?text=03",
  ],
  productName: "The Collection",
  caption: "precision · restraint · detail",
  brandColor: "#000000",
};

const FRAMES_PER_SLIDE = 70;
const TRANSITION = 18;

export const EditorialShowcase: React.FC<EditorialShowcaseProps> = ({
  images,
  productName,
  caption,
  brandColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#f0ede8", overflow: "hidden" }}>
      {images.map((src, i) => {
        const start = i * FRAMES_PER_SLIDE;
        const local = frame - start;

        // Reveal: slide up from slightly below
        const translateY = interpolate(local, [0, TRANSITION], [30, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const fadeIn = interpolate(local, [0, TRANSITION], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const fadeOut = interpolate(
          local,
          [FRAMES_PER_SLIDE - TRANSITION, FRAMES_PER_SLIDE],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const opacity = Math.min(fadeIn, fadeOut);

        // Subtle Ken Burns drift
        const scale = interpolate(local, [0, FRAMES_PER_SLIDE], [1.0, 1.05], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <Sequence key={i} from={start} durationInFrames={FRAMES_PER_SLIDE + TRANSITION}>
            <AbsoluteFill style={{ opacity, transform: `translateY(${translateY}px)` }}>
              {/* Image — occupies top 80% */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  bottom: "20%",
                  overflow: "hidden",
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
              </div>

              {/* Bottom strip */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "20%",
                  backgroundColor: "#f0ede8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 64px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "-apple-system, 'General Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      letterSpacing: "2.4px",
                      textTransform: "uppercase",
                      color: "#888",
                      marginBottom: 8,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      fontFamily: "-apple-system, 'General Sans', sans-serif",
                      fontSize: 42,
                      fontWeight: 600,
                      letterSpacing: "-0.8px",
                      color: "#111",
                      lineHeight: 1.1,
                    }}
                  >
                    {productName}
                  </div>
                </div>
                {/* Color swatch */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: brandColor,
                  }}
                />
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* Caption ribbon — persistent */}
      <AbsoluteFill
        style={{
          alignItems: "flex-start",
          justifyContent: "flex-start",
          padding: "48px 64px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "-apple-system, 'General Sans', sans-serif",
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: "1.8px",
            textTransform: "uppercase",
            color: "#aaa",
            opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {caption}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
