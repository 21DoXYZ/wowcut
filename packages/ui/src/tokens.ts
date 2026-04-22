export const brandColors = {
  black: "#000000",
  white: "#FFFFFF",
  glassDark: "rgba(0, 0, 0, 0.08)",
  glassLight: "rgba(255, 255, 255, 0.16)",
  muted: "#666666",
  dashedFocus: "#000000",
  gradient: {
    hero: "linear-gradient(115deg, #86FF6B 0%, #FFE24B 32%, #FF4BD4 62%, #7A3BFF 100%)",
    design: "linear-gradient(135deg, #7A3BFF 0%, #FF4BD4 100%)",
    cgi: "linear-gradient(135deg, #86FF6B 0%, #FFE24B 100%)",
    editorial: "linear-gradient(135deg, #1A1A1A 0%, #3E3E3E 100%)",
  },
} as const;

export const brandFontWeight = {
  whisper: 320,
  light: 330,
  book: 340,
  medium: 450,
  strong: 480,
  bold: 540,
  heavy: 700,
} as const;

export const brandFontSize = {
  display: "86px",
  heading: "64px",
  subheading: "26px",
  featureTitle: "24px",
  bodyLarge: "20px",
  bodyMedium: "18px",
  body: "16px",
  monoLabel: "18px",
  monoSmall: "12px",
} as const;

export const brandLetterSpacing = {
  display: "-1.72px",
  heading: "-0.96px",
  subheading: "-0.26px",
  bodyLarge: "-0.14px",
  bodyMedium: "-0.1px",
  body: "-0.14px",
  monoLabel: "0.54px",
  monoSmall: "0.6px",
} as const;

export const brandRadius = {
  sm: "2px",
  md: "6px",
  lg: "8px",
  pill: "50px",
  circle: "50%",
} as const;

export const brandFocus = {
  outlineStyle: "dashed",
  outlineWidth: "2px",
  outlineOffset: "2px",
} as const;
