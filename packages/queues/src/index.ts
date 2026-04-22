import IORedis from "ioredis";
import { Queue } from "bullmq";
import { QUEUE_NAMES, QUEUE_PRIORITIES } from "@wowcut/shared";

let cachedRedis: IORedis | null = null;

export function getRedis(): IORedis {
  if (cachedRedis) return cachedRedis;
  if (!process.env.REDIS_URL) throw new Error("REDIS_URL not configured");
  cachedRedis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  return cachedRedis;
}

let cachedQueues: ReturnType<typeof makeQueues> | null = null;

function makeQueues() {
  const connection = getRedis();
  return {
    previewQueue: new Queue(QUEUE_NAMES.preview, { connection }),
    generationQueue: new Queue(QUEUE_NAMES.generation, { connection }),
    qcQueue: new Queue(QUEUE_NAMES.qc, { connection }),
    qcCalibrationQueue: new Queue(QUEUE_NAMES.qcCalibration, { connection }),
    assemblyQueue: new Queue(QUEUE_NAMES.assembly, { connection }),
    deliveryQueue: new Queue(QUEUE_NAMES.delivery, { connection }),
    trendQueue: new Queue(QUEUE_NAMES.trend, { connection }),
    onboardingCleanupQueue: new Queue(QUEUE_NAMES.onboardingCleanup, { connection }),
    weekPassExpiryQueue: new Queue(QUEUE_NAMES.weekPassExpiry, { connection }),
    veoPollQueue: new Queue(QUEUE_NAMES.veoPoll, { connection }),
  };
}

export function queues() {
  if (!cachedQueues) cachedQueues = makeQueues();
  return cachedQueues;
}

// Convenience producer functions (called from api + workers)

export async function enqueuePreview(previewId: string) {
  const q = queues().previewQueue;
  await q.add(
    "preview",
    { previewId },
    { priority: QUEUE_PRIORITIES.preview, attempts: 2 },
  );
}

export async function enqueuePilotMinimum(unitIds: string[]) {
  const q = queues().generationQueue;
  for (const unitId of unitIds) {
    await q.add(
      "gen",
      { unitId, alternateIndex: 0, kind: "pilot_minimum" },
      { priority: QUEUE_PRIORITIES.pilot_minimum, attempts: 3 },
    );
  }
}

export async function enqueueWeeklyBatch(unitIds: string[]) {
  const q = queues().generationQueue;
  for (const unitId of unitIds) {
    for (let i = 0; i < 3; i++) {
      await q.add(
        "gen",
        { unitId, alternateIndex: i, kind: "weekly_batch" },
        { priority: QUEUE_PRIORITIES.weekly_batch, attempts: 3 },
      );
    }
  }
}

export async function enqueueRetry(unitId: string) {
  const q = queues().generationQueue;
  await q.add(
    "gen",
    { unitId, alternateIndex: 0, kind: "retry" },
    { priority: QUEUE_PRIORITIES.retry, attempts: 3 },
  );
}

export async function enqueueAssembly(unitId: string) {
  const q = queues().assemblyQueue;
  await q.add("assembly", { unitId }, { attempts: 3 });
}

export async function enqueueQc(generationId: string) {
  const q = queues().qcQueue;
  await q.add("qc", { generationId }, { attempts: 2 });
}

export async function enqueueVeoPoll(
  generationId: string,
  operationName: string,
  attempt = 1,
): Promise<void> {
  const q = queues().veoPollQueue;
  // Exponential delay: first 15s, then 20s, 25s, ... capped at 45s.
  const delay = Math.min(15_000 + (attempt - 1) * 5_000, 45_000);
  await q.add(
    "veo-poll",
    { generationId, operationName, attempt },
    { delay, attempts: 1, removeOnComplete: true },
  );
}
