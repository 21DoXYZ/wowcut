import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TREND_THEMES_2026 = [
  { monthKey: "2026-05", theme: "Spring Refresh", description: "Clean, minimal renewal energy — glass skin, dewy finishes, soft pastels" },
  { monthKey: "2026-06", theme: "Summer Glow", description: "Luminous skin, golden hour lighting, beach-adjacent" },
  { monthKey: "2026-07", theme: "Quiet Luxury", description: "Neutral palettes, tactile materials, editorial restraint" },
  { monthKey: "2026-08", theme: "Back to Ritual", description: "Morning routine aesthetics, clean countertops, intentional" },
  { monthKey: "2026-09", theme: "Chromatic Fall", description: "Saturated autumn colors, rich textures, cinnamon/wine tones" },
  { monthKey: "2026-10", theme: "Moody Editorial", description: "Dark backgrounds, dramatic lighting, campaign-grade" },
  { monthKey: "2026-11", theme: "Black Friday Primer", description: "High-contrast product hero, sale-ready, stop-scroll" },
  { monthKey: "2026-12", theme: "Holiday Gifting", description: "Wrapped products, metallic accents, festive warmth" },
  { monthKey: "2027-01", theme: "Clean Start", description: "White, minimal, fresh year — soft skin, quiet confidence" },
  { monthKey: "2027-02", theme: "Romance", description: "Soft reds, tactile florals, Valentine's micro-season" },
  { monthKey: "2027-03", theme: "Chrome Moment", description: "Metallic liquids, high-shine products, futurist" },
  { monthKey: "2027-04", theme: "Botanical", description: "Plant-adjacent still life, natural light, ingredient-forward" },
];

const BRAND_FACE_PLACEHOLDERS = [
  { name: "Face 01 — Warm Olive", descriptors: { skinTone: "olive", age: "25-30", hair: "dark_brown" } },
  { name: "Face 02 — Deep Brown", descriptors: { skinTone: "deep", age: "25-30", hair: "black" } },
  { name: "Face 03 — Fair Cool", descriptors: { skinTone: "fair_cool", age: "22-28", hair: "blonde" } },
  { name: "Face 04 — Medium Neutral", descriptors: { skinTone: "medium_neutral", age: "28-34", hair: "brown" } },
  { name: "Face 05 — Deep Cool", descriptors: { skinTone: "deep_cool", age: "28-34", hair: "black" } },
  { name: "Face 06 — Light Warm", descriptors: { skinTone: "light_warm", age: "22-28", hair: "red" } },
  { name: "Face 07 — Medium Warm", descriptors: { skinTone: "medium_warm", age: "30-36", hair: "dark_brown" } },
  { name: "Face 08 — Fair Neutral", descriptors: { skinTone: "fair_neutral", age: "24-30", hair: "light_brown" } },
  { name: "Face 09 — Deep Warm", descriptors: { skinTone: "deep_warm", age: "26-32", hair: "black" } },
  { name: "Face 10 — Light Cool", descriptors: { skinTone: "light_cool", age: "22-28", hair: "platinum" } },
  { name: "Face 11 — Olive Mature", descriptors: { skinTone: "olive", age: "34-42", hair: "grey" } },
  { name: "Face 12 — Medium Editorial", descriptors: { skinTone: "medium", age: "28-34", hair: "brown" } },
];

const QC_STYLE_PROFILES = [
  {
    stylePreset: "social_style",
    compositeAutoApprove: 88,
    compositePass: 72,
    productIdentityMin: 0.78,
    promptFidelityMin: 0.28,
    aestheticMin: 5.5,
    brandColorDeltaMax: 20,
    compositionMin: 60,
    faceCountMin: 0,
    faceCountMax: 1,
    blurVarianceMin: 80,
  },
  {
    stylePreset: "editorial_hero",
    compositeAutoApprove: 93,
    compositePass: 78,
    productIdentityMin: 0.85,
    promptFidelityMin: 0.32,
    aestheticMin: 6.5,
    brandColorDeltaMax: 10,
    compositionMin: 75,
    faceCountMin: 0,
    faceCountMax: 0,
    blurVarianceMin: 150,
  },
  {
    stylePreset: "cgi_concept",
    compositeAutoApprove: 87,
    compositePass: 70,
    productIdentityMin: 0.70,
    promptFidelityMin: 0.26,
    aestheticMin: 5.0,
    brandColorDeltaMax: 30,
    compositionMin: 55,
    faceCountMin: 0,
    faceCountMax: 0,
    blurVarianceMin: 80,
    noveltyMin: 7.0,
  },
  {
    stylePreset: "fashion_campaign",
    compositeAutoApprove: 94,
    compositePass: 82,
    productIdentityMin: 0.72,
    promptFidelityMin: 0.30,
    aestheticMin: 7.0,
    brandColorDeltaMax: 15,
    compositionMin: 70,
    faceCountMin: 1,
    faceCountMax: 1,
    faceSimilarityMin: 0.85,
    blurVarianceMin: 120,
  },
];

async function main() {
  console.log("Seeding QC style profiles…");
  for (const profile of QC_STYLE_PROFILES) {
    await prisma.qcStyleProfile.upsert({
      where: { stylePreset: profile.stylePreset },
      update: profile,
      create: profile,
    });
  }

  console.log("Seeding trend drops…");
  for (const theme of TREND_THEMES_2026) {
    await prisma.trendDrop.upsert({
      where: { monthKey: theme.monthKey },
      update: { theme: theme.theme, description: theme.description },
      create: {
        monthKey: theme.monthKey,
        theme: theme.theme,
        description: theme.description,
        presets: { styleHint: null, promptOverrides: [] },
      },
    });
  }

  console.log("Seeding brand face placeholders…");
  for (const face of BRAND_FACE_PLACEHOLDERS) {
    const existing = await prisma.brandFace.findFirst({ where: { name: face.name } });
    if (!existing) {
      await prisma.brandFace.create({
        data: {
          name: face.name,
          referenceUrl: "https://placehold.co/512x512?text=" + encodeURIComponent(face.name),
          descriptors: face.descriptors,
          active: false,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
