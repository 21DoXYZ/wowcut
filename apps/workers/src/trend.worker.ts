import { Worker, Queue } from "bullmq";
import { QUEUE_NAMES, monthKey, PLAN_LIMITS } from "@wowcut/shared";
import { prisma } from "@wowcut/db";
import { sendEmail, TrendDropAnnouncementEmail } from "@wowcut/email";
import { redis } from "./redis";

export const trendWorker = new Worker(
  QUEUE_NAMES.trend,
  async () => {
    const currentMonth = monthKey();
    const drop = await prisma.trendDrop.findUnique({ where: { monthKey: currentMonth } });
    if (!drop) {
      console.log(`[trend] No drop for ${currentMonth} — skipping`);
      return;
    }
    await prisma.trendDrop.update({
      where: { monthKey: currentMonth },
      data: { publishedAt: new Date() },
    });

    const activeClients = await prisma.client.findMany({
      where: { status: "active" },
      include: { skus: { where: { active: true } } },
    });

    for (const client of activeClients) {
      const bonus = PLAN_LIMITS[client.plan].trendDropBonusUnits;
      const skus = client.skus.slice(0, 2);
      if (skus.length === 0) continue;

      const stylePick = client.selectedStyles[0] ?? "editorial_hero";

      const unitIds: string[] = [];
      for (let i = 0; i < bonus; i++) {
        const sku = skus[i % skus.length]!;
        const unit = await prisma.contentPlanItem.create({
          data: {
            clientId: client.id,
            weekKey: `${currentMonth}-trend`,
            weekIndex: 0,
            slotIndex: i,
            skuId: sku.id,
            stylePreset: stylePick as never,
            format: "static",
            primaryChannel: "instagram",
            aspectRatios: ["1:1", "9:16"],
            isTrendDrop: true,
            tags: ["trend_drop", drop.theme],
          },
        });
        unitIds.push(unit.id);
      }

      await prisma.trendDropAssignment.upsert({
        where: { trendDropId_clientId: { trendDropId: drop.id, clientId: client.id } },
        update: { unitIds },
        create: {
          trendDropId: drop.id,
          clientId: client.id,
          unitIds,
        },
      });

      if (process.env.RESEND_API_KEY) {
        await sendEmail({
          to: client.email,
          subject: `This month's Trend Drop: ${drop.theme}`,
          react: TrendDropAnnouncementEmail({
            brandName: client.name,
            theme: drop.theme,
            description: drop.description,
            libraryUrl: `${process.env.NEXT_PUBLIC_CLIENT_URL}/library?trendOnly=true`,
          }),
        }).catch(() => {});
      }
    }
  },
  { connection: redis, concurrency: 1 },
);

export async function scheduleMonthlyTrend(queue: Queue) {
  await queue.add(
    "monthly",
    {},
    {
      repeat: { pattern: "0 9 1 * *" },
      removeOnComplete: true,
    },
  );
}

trendWorker.on("failed", (job, err) => console.error("[trend] failed", job?.id, err.message));
