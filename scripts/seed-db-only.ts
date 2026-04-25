/**
 * Seeds Client record + QC profiles in the DB (no Supabase auth needed).
 * Run: tsx scripts/seed-db-only.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const QC_PROFILES = [
  {
    stylePreset: "social_style",
    compositeAutoApprove: 80,
    compositePass: 60,
    productIdentityMin: 0.55,
    promptFidelityMin: 0.55,
    aestheticMin: 5.5,
    brandColorDeltaMax: 40,
    compositionMin: 55,
    faceCountMin: 0,
    faceCountMax: 2,
    blurVarianceMin: 80,
  },
  {
    stylePreset: "editorial_hero",
    compositeAutoApprove: 82,
    compositePass: 65,
    productIdentityMin: 0.65,
    promptFidelityMin: 0.60,
    aestheticMin: 6.0,
    brandColorDeltaMax: 35,
    compositionMin: 60,
    faceCountMin: 0,
    faceCountMax: 0,
    blurVarianceMin: 100,
  },
  {
    stylePreset: "cgi_concept",
    compositeAutoApprove: 78,
    compositePass: 58,
    productIdentityMin: 0.50,
    promptFidelityMin: 0.55,
    aestheticMin: 5.5,
    brandColorDeltaMax: 45,
    compositionMin: 55,
    faceCountMin: 0,
    faceCountMax: 0,
    blurVarianceMin: 80,
    noveltyMin: 0.6,
  },
  {
    stylePreset: "fashion_campaign",
    compositeAutoApprove: 80,
    compositePass: 62,
    productIdentityMin: 0.55,
    promptFidelityMin: 0.55,
    aestheticMin: 6.0,
    brandColorDeltaMax: 40,
    compositionMin: 58,
    faceCountMin: 1,
    faceCountMax: 2,
    faceSimilarityMin: 0.75,
    blurVarianceMin: 80,
  },
];

async function main() {
  console.log("Seeding DB...\n");

  // Upsert QC profiles (needed by preview + generation workers)
  for (const profile of QC_PROFILES) {
    await prisma.qcStyleProfile.upsert({
      where: { stylePreset: profile.stylePreset },
      update: profile,
      create: profile,
    });
    console.log(`✓ QC profile: ${profile.stylePreset}`);
  }

  // Upsert test client
  const client = await prisma.client.upsert({
    where: { email: "test@wowcut.ai" },
    update: { status: "active", plan: "premium" },
    create: {
      slug: "dev-wowcut",
      name: "Dev Brand",
      email: "test@wowcut.ai",
      plan: "premium",
      status: "active",
      brandColors: ["#0A0A0A", "#F4E7D8"],
      channels: ["instagram", "tiktok"],
      selectedStyles: ["social_style", "editorial_hero", "cgi_concept"],
      toneOfVoice: "confident, minimal, editorial",
    },
  });

  console.log(`✓ Client: ${client.name} — ${client.email} (id: ${client.id})`);
  console.log("\nDone. Now create the Supabase auth user:");
  console.log("  Email:    test@wowcut.ai");
  console.log("  Password: Wowcut2024!");
  console.log("  URL: https://supabase.com/dashboard/project/dcdheensoyfcuaejlzao/auth/users");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
