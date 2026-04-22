// Local LAB ΔE helpers. CLIP similarity moved to embeddings.ts (Vertex multimodalembedding@001).

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RgbColor {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToLab({ r, g, b }: RgbColor): [number, number, number] {
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const R = f(r);
  const G = f(g);
  const B = f(b);
  const X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  const g2 = (t: number) =>
    t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
  const fx = g2(X / 0.95047);
  const fy = g2(Y / 1.0);
  const fz = g2(Z / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function deltaE76(c1: RgbColor, c2: RgbColor): number {
  const [l1, a1, b1] = rgbToLab(c1);
  const [l2, a2, b2] = rgbToLab(c2);
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

export function minDeltaE(target: RgbColor, palette: RgbColor[]): number {
  if (palette.length === 0) return 0;
  return palette.reduce((min, c) => Math.min(min, deltaE76(target, c)), Infinity);
}
