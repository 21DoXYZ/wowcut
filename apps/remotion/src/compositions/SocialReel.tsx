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

export const SocialReelSchema = z.object({
  images: z.array(z.string()).min(1).max(6),
  caption: z.string(),
  brandName: z.string(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export type SocialReelProps = z.infer<typeof SocialReelSchema>;

export const socialReelDefaults: SocialReelProps = {
  images: [
    "https://placehold.co/1080x1920/111111/ffffff?text=1",
    "https://placehold.co/1080x1920/222222/ffffff?text=2",
    "https://placehold.co/1080x1920/333333/ffffff?text=3",
  ],
  caption: "minimal · clean · editorial",
  brandName: "Brand",
  brandColor: "#FF4545",
};

const FRAMES_PER_SLIDE = 60; // 2s per image at 30fps
const TRANSITION_FRAMES = 12;

interface SlideProps {
  src: string;
  startFrame: number;
  totalSlides: number;
  slideIndex: number;
  brandColor: string;
}

const Slide: React.FC<SlideProps> = ({ src, startFrame, totalSlides, slideIndex, brandColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  // Ken Burns: slow zoom in
  const scale = interpolate(localFrame, [0, FRAMES_PER_SLIDE], [1.0, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade in at start
  const fadeIn = interpolate(localFrame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out at end
  const fadeOut = interpolate(
    localFrame,
    [FRAMES_PER_SLIDE - TRANSITION_FRAMES, FRAMES_PER_SLIDE],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const opacity = Math.min(fadeIn, fadeOut);

  // Dot indicator position
  const isLast = slideIndex === totalSlides - 1;
  const dotReveal = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 220 } });

  return (
    <AbsoluteFill style={{ opacity }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
      {/* CTA dot on last slide */}
      {isLast && (
        <AbsoluteFill
          style={{
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: 56,
            opacity: dotReveal,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: brandColor,
              boxShadow: `0 0 0 8px ${brandColor}33`,
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const SocialReel: React.FC<SocialReelProps> = ({
  images,
  caption,
  brandName,
  brandColor,
}) => {
  const frame = useCurrentFrame();
  const { totalFrames } = useVideoConfig();

  const captionOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const captionY = interpolate(frame, [0, 20], [16, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* Slides stacked — each fades over the next */}
      {images.map((src, i) => (
        <Sequence key={i} from={i * FRAMES_PER_SLIDE} durationInFrames={FRAMES_PER_SLIDE + TRANSITION_FRAMES}>
          <Slide
            src={src}
            startFrame={i * FRAMES_PER_SLIDE}
            totalSlides={images.length}
            slideIndex={i}
            brandColor={brandColor}
          />
        </Sequence>
      ))}

      {/* Bottom caption bar */}
      <AbsoluteFill
        style={{
          alignItems: "flex-end",
          justifyContent: "flex-start",
          padding: "0 48px 72px",
          opacity: captionOpacity,
          transform: `translateY(${captionY}px)`,
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "-apple-system, 'General Sans', sans-serif",
              color: "#fff",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              opacity: 0.6,
              marginBottom: 8,
            }}
          >
            {brandName}
          </div>
          <div
            style={{
              fontFamily: "-apple-system, 'General Sans', sans-serif",
              color: "#fff",
              fontSize: 34,
              fontWeight: 500,
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
            }}
          >
            {caption}
          </div>
        </div>
      </AbsoluteFill>

      {/* Progress dots */}
      <AbsoluteFill
        style={{
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: 32,
          gap: 6,
          flexDirection: "row",
        }}
      >
        {images.map((_, i) => {
          const dotFrame = frame - i * FRAMES_PER_SLIDE;
          const active = dotFrame >= 0 && dotFrame < FRAMES_PER_SLIDE;
          return (
            <div
              key={i}
              style={{
                width: active ? 24 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: active ? brandColor : "rgba(255,255,255,0.4)",
                transition: "width 0.2s",
                margin: "0 3px",
              }}
            />
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
