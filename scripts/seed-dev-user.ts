/**
 * Creates a real test user in Supabase Auth + Client record in DB + QC profiles.
 * Run: DATABASE_URL="..." DIRECT_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." tsx scripts/seed-dev-user.ts
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const SUPABASE_URL = "https://dcdheensoyfcuaejlzao.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DATABASE_URL = process.env.DATABASE_URL!;

const TEST_EMAIL = "test@wowcut.ai";
const TEST_PASSWORD = "Wowcut2024!";

if (!SERVICE_ROLE_KEY) {
  console.error("❌  SUPABASE_SERVICE_ROLE_KEY is required");
  console.error("   Get it from: https://supabase.com/dashboard/project/dcdheensoyfcuaejlzao/settings/api");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

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
  console.log("🔧 Creating dev test user...\n");

  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (authError && !authError.message.includes("already been registered")) {
    throw new Error(`Auth user creation failed: ${authError.message}`);
  }

  const userId = authData?.user?.id;
  console.log(`✓ Auth user: ${TEST_EMAIL} (id: ${userId ?? "already exists"})`);

  // 2. Create Client record (upsert by email)
  const client = await prisma.client.upsert({
    where: { email: TEST_EMAIL },
    update: {},
    create: {
      slug: "dev-wowcut",
      name: "Dev Brand",
      email: TEST_EMAIL,
      plan: "premium",
      status: "active",
      brandColors: ["#0A0A0A", "#F4E7D8"],
      channels: ["instagram", "tiktok"],
      selectedStyles: ["social_style", "editorial_hero", "cgi_concept"],
      toneOfVoice: "confident, minimal, editorial",
    },
  });

  console.log(`✓ Client record: ${client.name} (id: ${client.id})`);

  // 3. Upsert QC style profiles (required by preview worker)
  for (const profile of QC_PROFILES) {
    await prisma.qcStyleProfile.upsert({
      where: { stylePreset: profile.stylePreset },
      update: {},
      create: profile,
    });
    console.log(`✓ QC profile: ${profile.stylePreset}`);
  }

  console.log(`
✅ Done!

Login at: https://wowcut.ai/sign-in
Email:    ${TEST_EMAIL}
Password: ${TEST_PASSWORD}
`);
}

main()
  .catch((err) => {
    console.error("❌", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
