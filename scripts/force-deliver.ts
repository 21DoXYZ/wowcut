/**
 * Bypass assembly — directly mark units with succeeded generations as delivered
 * and link them to the delivery. Useful for testing when Remotion isn't set up.
 *
 * Run:
 *   DATABASE_URL=... REDIS_URL=... npx tsx scripts/force-deliver.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CLIENT_ID = "cmoguoidl00004mghq0jy70i4";
const WEEK_KEY = "2026-W18";

async function main() {
  // Find units with succeeded generations
  const unitsWithGen = await (prisma as any).$queryRawUnsafe(`
    SELECT DISTINCT ON (c.id)
      c.id as unit_id,
      c."stylePreset",
      c.format,
      c.status as unit_status,
      g.id as gen_id,
      g."outputUrl"
    FROM public."ContentPlanItem" c
    JOIN public."Generation" g ON g."unitId" = c.id
    WHERE c."clientId" = '${CLIENT_ID}'
      AND g.status = 'succeeded'
      AND g."outputUrl" IS NOT NULL
    ORDER BY c.id, g."createdAt" DESC
  `);

  console.log(`Found ${unitsWithGen.length} units with succeeded generations:`);
  for (const u of unitsWithGen) {
    console.log(`  ${u.stylepreset} / ${u.format} (${u.unit_status})`);
  }

  // Ensure delivery exists
  const delivery = await prisma.delivery.upsert({
    where: { clientId_weekKey: { clientId: CLIENT_ID, weekKey: WEEK_KEY } },
    update: {},
    create: { clientId: CLIENT_ID, weekKey: WEEK_KEY },
  });
  console.log(`\nDelivery: ${delivery.id} (${WEEK_KEY})`);

  // Mark each unit as delivered and link to delivery
  for (const u of unitsWithGen) {
    await prisma.contentPlanItem.update({
      where: { id: u.unit_id },
      data: {
        chosenGenerationId: u.gen_id,
        deliveryId: delivery.id,
        status: "delivered",
      },
    });

    // Create library item if it doesn't exist
    await prisma.libraryItem.upsert({
      where: { unitId: u.unit_id },
      update: {},
      create: {
        clientId: CLIENT_ID,
        unitId: u.unit_id,
        tags: [],
      },
    });

    console.log(`  delivered: ${u.stylepreset} / ${u.format}`);
  }

  console.log("\n✅ Done — all units delivered and linked to delivery.");
  console.log(`   Visit /deliveries to see the content (week ${WEEK_KEY})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
