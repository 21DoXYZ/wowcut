import { PrismaClient } from "@prisma/client";
import { enqueuePilotMinimum } from "@wowcut/queues";

const prisma = new PrismaClient();
const CLIENT_ID = "cmoguoidl00004mghq0jy70i4";

async function main() {
  // Reset editorial_hero generation records that failed
  await prisma.generation.updateMany({
    where: {
      unit: { clientId: CLIENT_ID, stylePreset: "editorial_hero" },
      status: { in: ["failed", "running", "queued"] },
    },
    data: { status: "queued" },
  });

  // Reset unit to planned
  await prisma.contentPlanItem.updateMany({
    where: { clientId: CLIENT_ID, stylePreset: "editorial_hero" },
    data: { status: "planned" },
  });

  const unit = await prisma.contentPlanItem.findFirst({
    where: { clientId: CLIENT_ID, stylePreset: "editorial_hero" },
  });
  if (!unit) throw new Error("editorial_hero unit not found");

  await enqueuePilotMinimum([unit.id]);
  console.log(`Queued editorial_hero (${unit.id})`);
  console.log("Watch Railway logs for generation progress");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
