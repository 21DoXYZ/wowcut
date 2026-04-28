import { Worker, Queue } from "bullmq";
import { QUEUE_NAMES, weekKey } from "@wowcut/shared";
import { prisma } from "@wowcut/db";
import { sendEmail, DeliveryReadyEmail } from "@wowcut/email";
import { generateCaption } from "@wowcut/ai";
import { uploadObject, R2Keys } from "@wowcut/storage";
import { redis } from "./redis";

export interface DeliveryJobData {
  clientId?: string;
  weekKey?: string;
}

export const deliveryWorker = new Worker<DeliveryJobData>(
  QUEUE_NAMES.delivery,
  async (job) => {
    const targetWeek = job.data.weekKey ?? weekKey();
    const clients = job.data.clientId
      ? await prisma.client.findMany({ where: { id: job.data.clientId } })
      : await prisma.client.findMany({ where: { status: "active" } });

    for (const client of clients) {
      const units = await prisma.contentPlanItem.findMany({
        where: { clientId: client.id, weekKey: targetWeek, status: "delivered" },
        include: { sku: true, chosenGeneration: true },
      });
      if (units.length === 0) continue;

      const rows = [
        ["filename", "suggested_post_date", "caption", "hashtags", "channel"].join(","),
      ];
      for (const unit of units) {
        const cap = await generateCaption({
          brandName: client.name,
          productName: unit.sku.name,
          stylePreset: unit.stylePreset,
          toneOfVoice: client.toneOfVoice ?? "minimal",
          channel: unit.primaryChannel,
        }).catch(() => ({ caption: "", hashtags: [] }));
        const filename = `${client.slug}_${unit.sku.name}_${unit.stylePreset}_${unit.format}.${unit.format === "short_motion" ? "mp4" : "jpg"}`;
        rows.push(
          [
            JSON.stringify(filename),
            "",
            JSON.stringify(cap.caption),
            JSON.stringify(cap.hashtags.join(" ")),
            unit.primaryChannel,
          ].join(","),
        );
      }

      const csv = rows.join("\n");
      const csvKey = R2Keys.delivery(client.slug, targetWeek, "publishing_pack.csv");
      const csvUrl = await uploadObject({
        key: csvKey,
        body: Buffer.from(csv, "utf-8"),
        contentType: "text/csv",
      }).catch((err) => {
        console.error("[delivery] CSV upload failed", client.slug, err);
        return "";
      });

      const delivery = await prisma.delivery.upsert({
        where: { clientId_weekKey: { clientId: client.id, weekKey: targetWeek } },
        update: { publishingPackUrl: csvUrl },
        create: {
          clientId: client.id,
          weekKey: targetWeek,
          publishingPackUrl: csvUrl,
          items: { connect: units.map((u) => ({ id: u.id })) },
        },
      });

      if (process.env.RESEND_API_KEY && client.emailNotifications) {
        const emailErr = await sendEmail({
          to: client.email,
          subject: `${targetWeek}: your ${units.length} new assets are ready`,
          react: DeliveryReadyEmail({
            brandName: client.name,
            weekNumber: Number(targetWeek.split("W")[1] ?? 0),
            heroImageUrl: units[0]?.chosenGeneration?.outputUrl ?? "",
            unitCount: units.length,
            deliveryUrl: `${process.env.NEXT_PUBLIC_CLIENT_URL}/deliveries`,
          }),
        }).then(() => null).catch((e: Error) => e);

        if (emailErr) {
          console.error("[delivery] email failed for", client.slug, emailErr.message);
        } else {
          await prisma.delivery.update({
            where: { id: delivery.id },
            data: { emailSentAt: new Date() },
          });
        }
      } else if (!process.env.RESEND_API_KEY) {
        console.warn("[delivery] RESEND_API_KEY not set — email skipped for", client.slug);
      }
    }
  },
  { connection: redis, concurrency: 2 },
);

export async function scheduleWeeklyDelivery(queue: Queue) {
  await queue.add(
    "weekly",
    {},
    {
      repeat: { pattern: "0 9 * * 1" },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}
