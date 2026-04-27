/**
 * Seed a test client account for hello@wowcut.ai
 * Run: DATABASE_URL=... DIRECT_URL=... npx tsx scripts/seed-test-client.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL = "hello@wowcut.ai";
const SLUG = "wowcut-test";
const WEEK_KEY = "2026-W18"; // current week

async function main() {
  // ── 1. Upsert client ────────────────────────────────────────────────────────
  const client = await prisma.client.upsert({
    where: { email: EMAIL },
    update: {
      status: "active",
      plan: "base",
      name: "Wowcut Test",
    },
    create: {
      email: EMAIL,
      slug: SLUG,
      name: "Wowcut Test",
      plan: "base",
      status: "active",
      brandColors: ["#111111", "#F7F5F2"],
      toneOfVoice: "fresh, confident, aspirational",
      channels: ["instagram", "tiktok"],
      selectedStyles: ["social_style", "editorial_hero", "cgi_concept", "fashion_campaign"],
    },
  });
  console.log("✓ Client:", client.id, client.email);

  // ── 2. Upsert a test SKU ────────────────────────────────────────────────────
  const existingSku = await prisma.sku.findFirst({ where: { clientId: client.id } });
  let sku = existingSku;
  if (!sku) {
    sku = await prisma.sku.create({
      data: {
        clientId: client.id,
        name: "Test Serum 30ml",
        category: "serum",
        shape: "bottle",
        material: "glass",
        primaryColor: "#D4A8A0",
        imageUrl: "https://via.placeholder.com/600x800/D4A8A0/ffffff?text=Test+SKU",
        notes: "Test product for pipeline validation",
      },
    });
    console.log("✓ SKU:", sku.id);
  } else {
    console.log("✓ SKU (existing):", sku.id);
  }

  // ── 3. Seed content plan items for current week ─────────────────────────────
  const UNITS = [
    { style: "social_style",      format: "static",       channel: "instagram", slot: 0 },
    { style: "editorial_hero",    format: "static",       channel: "instagram", slot: 1 },
    { style: "cgi_concept",       format: "static",       channel: "instagram", slot: 2 },
    { style: "fashion_campaign",  format: "static",       channel: "instagram", slot: 3 },
    { style: "social_style",      format: "short_motion", channel: "tiktok",    slot: 4 },
  ] as const;

  for (const u of UNITS) {
    const existing = await prisma.contentPlanItem.findFirst({
      where: { clientId: client.id, weekKey: WEEK_KEY, slotIndex: u.slot },
    });
    if (existing) {
      console.log(`  · unit slot ${u.slot} already exists (${existing.id})`);
      continue;
    }
    const unit = await prisma.contentPlanItem.create({
      data: {
        clientId: client.id,
        skuId: sku.id,
        weekKey: WEEK_KEY,
        weekIndex: 0,
        slotIndex: u.slot,
        stylePreset: u.style,
        format: u.format,
        primaryChannel: u.channel,
        aspectRatios: u.format === "short_motion" ? ["9:16"] : ["1:1", "4:5"],
        status: "planned",
        tags: ["test"],
      },
    });
    console.log(`  ✓ unit ${u.slot}: ${u.style} / ${u.format}`);
  }

  // ── 4. Seed a delivery record for this week ─────────────────────────────────
  await prisma.delivery.upsert({
    where: { clientId_weekKey: { clientId: client.id, weekKey: WEEK_KEY } },
    update: {},
    create: { clientId: client.id, weekKey: WEEK_KEY },
  });
  console.log("✓ Delivery for", WEEK_KEY);

  console.log("\n✅ Done. Login with hello@wowcut.ai to test the full flow.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
