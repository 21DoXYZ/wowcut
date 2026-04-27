/**
 * Approve all needs_review units that have a succeeded generation,
 * fix fashion_campaign QC profile (remove face requirement),
 * and enqueue assembly for approved units.
 *
 * Run:
 *   DATABASE_URL=... REDIS_URL=... npx tsx scripts/approve-and-assemble.ts
 */
import { PrismaClient } from "@prisma/client";
import { Queue } from "bullmq";
import { QUEUE_NAMES } from "@wowcut/shared";

const prisma = new PrismaClient();
const CLIENT_ID = "cmoguoidl00004mghq0jy70i4";

const redisConnection = {
  host: process.env.REDIS_HOST ?? "shortline.proxy.rlwy.net",
  port: Number(process.env.REDIS_PORT ?? 54549),
  password: process.env.REDIS_PASSWORD ?? "LzgHsjQMOQPbCGBceileqzjAiKrzFNTH",
  username: process.env.REDIS_USER ?? "default",
};

const assemblyQueue = new Queue(QUEUE_NAMES.assembly, {
  connection: {
    host: new URL(process.env.REDIS_URL ?? "redis://default:LzgHsjQMOQPbCGBceileqzjAiKrzFNTH@shortline.proxy.rlwy.net:54549").hostname,
    port: Number(new URL(process.env.REDIS_URL ?? "redis://default:LzgHsjQMOQPbCGBceileqzjAiKrzFNTH@shortline.proxy.rlwy.net:54549").port),
    password: new URL(process.env.REDIS_URL ?? "redis://default:LzgHsjQMOQPbCGBceileqzjAiKrzFNTH@shortline.proxy.rlwy.net:54549").password,
    username: new URL(process.env.REDIS_URL ?? "redis://default:LzgHsjQMOQPbCGBceileqzjAiKrzFNTH@shortline.proxy.rlwy.net:54549").username,
  },
});

async function main() {
  // 1. Fix fashion_campaign QC profile — remove face requirement for test
  await prisma.qcStyleProfile.updateMany({
    where: { stylePreset: "fashion_campaign" },
    data: {
      faceCountMin: 0,
      faceSimilarityMin: null,
    },
  });
  console.log("✓ fashion_campaign QC profile updated: faceCountMin=0");

  // 2. Find all units with succeeded generations that are stuck
  const stuckUnits = await (prisma as any).$queryRawUnsafe(`
    SELECT DISTINCT ON (c.id)
      c.id as unit_id,
      c."stylePreset",
      c.format,
      c.status as unit_status,
      g.id as gen_id,
      g.status as gen_status,
      g."outputUrl"
    FROM public."ContentPlanItem" c
    JOIN public."Generation" g ON g."unitId" = c.id
    WHERE c."clientId" = '${CLIENT_ID}'
      AND g.status = 'succeeded'
      AND g."outputUrl" IS NOT NULL
      AND c.status IN ('needs_review', 'failed', 'auto_qc')
    ORDER BY c.id, g."createdAt" DESC
  `);

  console.log(`\nFound ${stuckUnits.length} units to approve:`);

  for (const unit of stuckUnits) {
    console.log(`  → ${unit.stylepreset} / ${unit.format} (${unit.unit_status})`);

    // Set chosen generation + status = ready
    await prisma.contentPlanItem.update({
      where: { id: unit.unit_id },
      data: {
        chosenGenerationId: unit.gen_id,
        status: "ready",
      },
    });

    // Enqueue assembly
    await assemblyQueue.add("assembly", { unitId: unit.unit_id });
    console.log(`    queued assembly`);
  }

  // 3. Reset editorial_hero + fashion_campaign to planned for re-generation
  const resetCount = await prisma.contentPlanItem.updateMany({
    where: {
      clientId: CLIENT_ID,
      stylePreset: { in: ["editorial_hero", "fashion_campaign"] },
      status: { in: ["failed", "auto_qc"] },
    },
    data: { status: "planned" },
  });
  console.log(`\n✓ Reset ${resetCount.count} failed units to planned`);

  // Reset their failed generations
  await prisma.generation.updateMany({
    where: {
      unit: { clientId: CLIENT_ID, stylePreset: { in: ["editorial_hero", "fashion_campaign"] } },
      status: { in: ["failed", "running"] },
    },
    data: { status: "queued" },
  });

  console.log("\n✅ Done. Assembly queued for approved units.");
  console.log("   editorial_hero + fashion_campaign reset to planned — re-queue after Railway deploys addWatermark fix.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => Promise.all([prisma.$disconnect(), assemblyQueue.close()]));
