import { z } from "zod";
import { AbsoluteFill, Img, Sequence, interpolate, useCurrentFrame } from "remotion";

export const ProductDemoSchema = z.object({
  imageUrl: z.string(),
  productName: z.string(),
  caption: z.string(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export type ProductDemoProps = z.infer<typeof ProductDemoSchema>;

export const productDemoDefaults: ProductDemoProps = {
  imageUrl: "https://placehold.co/1080x1920?text=Product",
  productName: "Your Product",
  caption: "What it does, in 4 words",
  brandColor: "#000000",
};

export const ProductDemo: React.FC<ProductDemoProps> = ({ imageUrl, productName, caption, brandColor }) => {
  const frame = useCurrentFrame();
  const slideY = interpolate(frame, [0, 24], [60, 0], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff" }}>
      <Img src={imageUrl} style={{ width: "100%", height: "72%", objectFit: "cover" }} />
      <AbsoluteFill
        style={{
          top: "72%",
          padding: 60,
          transform: `translateY(${slideY}px)`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "General Sans, sans-serif",
            color: "#000",
            fontSize: 56,
            fontWeight: 540,
            letterSpacing: "-0.96px",
          }}
        >
          {productName}
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: "General Sans, sans-serif",
            color: "#555",
            fontSize: 24,
            fontWeight: 330,
            letterSpacing: "-0.26px",
          }}
        >
          {caption}
        </div>
        <Sequence from={40}>
          <div
            style={{
              position: "absolute",
              right: 60,
              bottom: 60,
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: brandColor,
            }}
          />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
