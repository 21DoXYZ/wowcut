/**
 * Update test SKU with a real product image and enqueue generation for all planned units.
 * Run: DATABASE_URL=... DIRECT_URL=... REDIS_URL=... npx tsx scripts/trigger-test-generation.ts
 */
import { PrismaClient } from "@prisma/client";
import { enqueuePilotMinimum } from "@wowcut/queues";

const prisma = new PrismaClient();
const CLIENT_ID = "cmoguoidl00004mghq0jy70i4";

// Use a real beauty product reference image served from our own CDN
const REAL_PRODUCT_IMAGE = "https://wowcut-client-nrytqrv08-21doxyzs-projects.vercel.app/style-refs/editorial/2.png";

async function main() {
  // Update SKU with a real product image
  const sku = await prisma.sku.findFirst({ where: { clientId: CLIENT_ID } });
  if (!sku) throw new Error("No SKU found for test client");

  await prisma.sku.update({
    where: { id: sku.id },
    data: {
      imageUrl: REAL_PRODUCT_IMAGE,
      name: "Wowcut Test Serum",
      notes: "Beauty serum for pipeline test — editorial style reference image",
    },
  });
  console.log("✓ SKU updated with real product image:", REAL_PRODUCT_IMAGE);

  // Get all planned units
  const units = await prisma.contentPlanItem.findMany({
    where: { clientId: CLIENT_ID, status: "planned" },
    select: { id: true, stylePreset: true, format: true },
  });
  console.log(`✓ Found ${units.length} planned units`);

  // Enqueue all of them
  const unitIds = units.map((u) => u.id);
  await enqueuePilotMinimum(unitIds);

  for (const u of units) {
    console.log(`  → queued: ${u.stylePreset} / ${u.format} (${u.id})`);
  }

  console.log("\n✅ All units enqueued. Watch Railway logs for generation progress.");
  console.log("   Login at wowcut.ai/sign-in → check /deliveries in ~2-3 min");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
