import { PrismaClient } from "@prisma/client";
import { enqueuePilotMinimum } from "@wowcut/queues";

const prisma = new PrismaClient();
const CLIENT_ID = "cmoguoidl00004mghq0jy70i4";

async function main() {
  // Reset any failed generations and re-queue all planned/generating units
  await prisma.generation.updateMany({
    where: {
      unit: { clientId: CLIENT_ID },
      status: { in: ["failed", "running"] },
    },
    data: { status: "queued" },
  });

  // Reset unit statuses back to planned
  await prisma.contentPlanItem.updateMany({
    where: { clientId: CLIENT_ID, status: { in: ["failed", "generating", "auto_qc"] } },
    data: { status: "planned" },
  });

  const units = await prisma.contentPlanItem.findMany({
    where: { clientId: CLIENT_ID, status: "planned" },
    select: { id: true, stylePreset: true, format: true },
  });

  console.log(`Re-queuing ${units.length} units...`);
  await enqueuePilotMinimum(units.map((u) => u.id));
  for (const u of units) {
    console.log(`  → ${u.stylePreset} / ${u.format}`);
  }
  console.log("\n✅ Done — watch railway logs");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
