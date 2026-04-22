import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@wowcut/shared";
import { prisma } from "@wowcut/db";
import { redis } from "./redis";

export interface WeekPassExpiryJobData {
  reason?: string;
}

export const weekPassExpiryWorker = new Worker<WeekPassExpiryJobData>(
  QUEUE_NAMES.weekPassExpiry,
  async () => {
    const now = new Date();
    const expired = await prisma.client.findMany({
      where: {
        plan: "week_pass",
        status: "week_pass_active",
        weekPassExpiresAt: { lte: now },
      },
      select: { id: true, email: true, name: true },
    });

    for (const client of expired) {
      await prisma.client.update({
        where: { id: client.id },
        data: { status: "week_pass_expired" },
      });

      await prisma.auditLog.create({
        data: {
          actor: "system",
          action: "week_pass_expired",
          entity: `client:${client.id}`,
          metadata: { at: now.toISOString() },
        },
      });
    }

    if (expired.length > 0) {
      console.log(`[week-pass-expiry] flipped ${expired.length} clients to week_pass_expired`);
    }

    // Also handle paused subscriptions whose pausedUntil has passed — auto-resume.
    const resumed = await prisma.client.findMany({
      where: {
        status: "paused",
        pausedUntil: { lte: now },
      },
      select: { id: true },
    });
    for (const client of resumed) {
      await prisma.client.update({
        where: { id: client.id },
        data: { status: "active", pausedAt: null, pausedUntil: null },
      });
      await prisma.auditLog.create({
        data: {
          actor: "system",
          action: "pause_auto_resumed",
          entity: `client:${client.id}`,
          metadata: { at: now.toISOString() },
        },
      });
    }
  },
  { connection: redis, concurrency: 1 },
);

weekPassExpiryWorker.on("failed", (job, err) =>
  console.error("[week-pass-expiry] failed", job?.id, err.message),
);
