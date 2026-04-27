import IORedis from "ioredis";
import { Queue } from "bullmq";
import { QUEUE_NAMES, QUEUE_PRIORITIES } from "@wowcut/shared";

export { checkRateLimit } from "./rate-limit";
export type { RateLimitInput, RateLimitResult } from "./rate-limit";

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
    seedancePollQueue: new Queue(QUEUE_NAMES.seedancePoll, { connection }),
    aiconBootstrapQueue: new Queue(QUEUE_NAMES.aiconBootstrap, { connection }),
    aiconSceneQueue: new Queue(QUEUE_NAMES.aiconScene, { connection }),
    aiconAnimateQueue: new Queue(QUEUE_NAMES.aiconAnimate, { connection }),
    aiconAssemblyQueue: new Queue(QUEUE_NAMES.aiconAssembly, { connection }),
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

export async function enqueueSeedancePoll(
  generationId: string,
  taskId: string,
  attempt = 1,
  opts: { isAiconScene?: boolean } = {},
): Promise<void> {
  const q = queues().seedancePollQueue;
  // Exponential delay: first 15s, then 20s, 25s, ... capped at 45s.
  const delay = Math.min(15_000 + (attempt - 1) * 5_000, 45_000);
  await q.add(
    "seedance-poll",
    { generationId, taskId, attempt, isAiconScene: opts.isAiconScene ?? false },
    { delay, attempts: 1, removeOnComplete: true },
  );
}

export async function enqueueAiconBootstrap(projectId: string): Promise<void> {
  const q = queues().aiconBootstrapQueue;
  await q.add("bootstrap", { projectId }, { attempts: 1, removeOnComplete: 100 });
}

export async function enqueueAiconScene(sceneId: string): Promise<void> {
  const q = queues().aiconSceneQueue;
  await q.add(`scene-${sceneId}`, { sceneId }, { attempts: 2, removeOnComplete: 100 });
}

export async function enqueueAiconAnimate(sceneId: string): Promise<void> {
  const q = queues().aiconAnimateQueue;
  await q.add(`animate-${sceneId}`, { sceneId }, { attempts: 2, removeOnComplete: 100 });
}

export async function enqueueAiconAssembly(projectId: string): Promise<void> {
  const q = queues().aiconAssemblyQueue;
  // jobId acts as a dedupe key — only one assembly per project at a time.
  await q.add(
    "assembly",
    { projectId },
    { attempts: 2, removeOnComplete: 100, jobId: `aicon-assembly-${projectId}` },
  );
}
