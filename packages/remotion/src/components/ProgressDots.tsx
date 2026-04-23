import { interpolate, useCurrentFrame } from "remotion";

interface Props {
  count: number;
  holdFrames: number;
  fadeFrames: number;
  brandColor: string;
}

export function ProgressDots({ count, holdFrames, fadeFrames, brandColor }: Props) {
  const frame = useCurrentFrame();
  const cycleFrames = holdFrames + fadeFrames;

  const activeIndex = Math.min(Math.floor(frame / cycleFrames), count - 1);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 28,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === activeIndex;
        const progress = isActive
          ? interpolate(frame - i * cycleFrames, [0, holdFrames], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : i < activeIndex
            ? 1
            : 0;

        return (
          <div
            key={i}
            style={{
              height: 4,
              width: isActive ? 28 : 8,
              borderRadius: 4,
              background: isActive ? brandColor : "rgba(255,255,255,0.4)",
              transition: "width 0.2s",
              overflow: "hidden",
            }}
          >
            {isActive && (
              <div
                style={{
                  height: "100%",
                  width: `${progress * 100}%`,
                  background: "rgba(255,255,255,0.5)",
                  borderRadius: 4,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
