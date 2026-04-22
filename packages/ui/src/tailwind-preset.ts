import type { Config } from "tailwindcss";
import { brandColors, brandFontSize, brandLetterSpacing, brandRadius } from "./tokens";

export const wowcutTailwindPreset = {
  content: [],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: brandColors.black,
        paper: brandColors.white,
        muted: brandColors.muted,
        glassDark: brandColors.glassDark,
        glassLight: brandColors.glassLight,
      },
      fontFamily: {
        sans: [
          "'General Sans Variable'",
          "'General Sans'",
          "Inter",
          "-apple-system",
          "SF Pro Display",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "'JetBrains Mono Variable'",
          "'JetBrains Mono'",
          "SF Mono",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        display: [brandFontSize.display, { lineHeight: "1", letterSpacing: brandLetterSpacing.display }],
        heading: [brandFontSize.heading, { lineHeight: "1.1", letterSpacing: brandLetterSpacing.heading }],
        subheading: [brandFontSize.subheading, { lineHeight: "1.35", letterSpacing: brandLetterSpacing.subheading }],
        "feature-title": [brandFontSize.featureTitle, { lineHeight: "1.45" }],
        "body-lg": [brandFontSize.bodyLarge, { lineHeight: "1.4", letterSpacing: brandLetterSpacing.bodyLarge }],
        "body-md": [brandFontSize.bodyMedium, { lineHeight: "1.45", letterSpacing: brandLetterSpacing.bodyMedium }],
        body: [brandFontSize.body, { lineHeight: "1.45", letterSpacing: brandLetterSpacing.body }],
        "mono-label": [brandFontSize.monoLabel, { lineHeight: "1.3", letterSpacing: brandLetterSpacing.monoLabel }],
        "mono-sm": [brandFontSize.monoSmall, { lineHeight: "1", letterSpacing: brandLetterSpacing.monoSmall }],
      },
      fontWeight: {
        "fw-320": "320",
        "fw-330": "330",
        "fw-340": "340",
        "fw-450": "450",
        "fw-480": "480",
        "fw-540": "540",
        "fw-700": "700",
      },
      borderRadius: {
        pill: brandRadius.pill,
        "pill-sm": "24px",
      },
      backgroundImage: {
        "gradient-hero": brandColors.gradient.hero,
        "gradient-design": brandColors.gradient.design,
        "gradient-cgi": brandColors.gradient.cgi,
        "gradient-editorial": brandColors.gradient.editorial,
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        float: "0 4px 12px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
} satisfies Partial<Config>;
