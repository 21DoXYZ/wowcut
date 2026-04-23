import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";

interface Props {
  images: string[];
  /** frames each image stays on screen */
  holdFrames: number;
  /** frames for fade transition between images */
  fadeFrames: number;
  /** optional ken-burns scale per image */
  scale?: number;
}

export function CrossFadeImage({ images, holdFrames, fadeFrames, scale = 1.04 }: Props) {
  const frame = useCurrentFrame();
  const cycleFrames = holdFrames + fadeFrames;

  return (
    <AbsoluteFill>
      {images.map((src, i) => {
        const start = i * cycleFrames;
        const end = start + cycleFrames + fadeFrames;

        const opacity = interpolate(
          frame,
          [start, start + fadeFrames, end - fadeFrames, end],
          [0, 1, 1, i === images.length - 1 ? 1 : 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

        const currentScale = interpolate(
          frame,
          [start, end],
          [1, scale],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

        return (
          <AbsoluteFill key={src + i} style={{ opacity }}>
            <Img
              src={src}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${currentScale})`,
                transformOrigin: "center center",
              }}
            />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
}
