import { z } from "zod";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";

export const CatalogGridSchema = z.object({
  images: z.array(z.string()).min(4).max(4),
  brandName: z.string(),
});

export type CatalogGridProps = z.infer<typeof CatalogGridSchema>;

export const catalogDefaults: CatalogGridProps = {
  images: [
    "https://placehold.co/540x540?text=1",
    "https://placehold.co/540x540?text=2",
    "https://placehold.co/540x540?text=3",
    "https://placehold.co/540x540?text=4",
  ],
  brandName: "Catalog",
};

export const CatalogGrid: React.FC<CatalogGridProps> = ({ images, brandName }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", padding: 60, opacity }}>
      <div
        style={{
          fontFamily: "General Sans, sans-serif",
          fontSize: 32,
          fontWeight: 540,
          letterSpacing: "-0.5px",
          marginBottom: 24,
        }}
      >
        {brandName}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {images.map((src, i) => (
          <Img
            key={i}
            src={src}
            style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
