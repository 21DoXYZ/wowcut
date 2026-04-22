import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@wowcut/shared";
import { prisma } from "@wowcut/db";
import { redis } from "./redis";

export interface CalibrationJobData {
  stylePreset?: string;
}

const STYLES = ["social_style", "editorial_hero", "cgi_concept", "fashion_campaign"];
const MIN_SAMPLES = 30;
const CANDIDATE_THRESHOLDS = [80, 82, 84, 86, 88, 90, 92, 94, 96];

interface Sample {
  composite: number;
  operatorApproved: boolean;
}

async function gatherSamplesForStyle(stylePreset: string, windowDays = 30): Promise<Sample[]> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  // Signal 1: Auto-approved + confidence-sampled generations reviewed by operator
  const confidenceSamples = await prisma.generation.findMany({
    where: {
      sampledForConfidence: true,
      confidenceVerdict: { not: null },
      createdAt: { gte: since },
      unit: { stylePreset: stylePreset as never },
    },
    select: { qcComposite: true, confidenceVerdict: true },
  });

  // Signal 2: Borderline units — operator's chosenGenerationId is the approve, retries indicate rejects
  const borderlineUnits = await prisma.contentPlanItem.findMany({
    where: {
      stylePreset: stylePreset as never,
      createdAt: { gte: since },
      status: { in: ["ready", "delivered", "retry_requested"] },
    },
    include: { generations: true, chosenGeneration: true },
  });

  const samples: Sample[] = [];

  for (const gen of confidenceSamples) {
    if (gen.qcComposite == null) continue;
    samples.push({
      composite: gen.qcComposite,
      operatorApproved: gen.confidenceVerdict === "approve",
    });
  }

  for (const unit of borderlineUnits) {
    const chosen = unit.chosenGenerationId;
    for (const gen of unit.generations) {
      if (gen.qcComposite == null) continue;
      if (gen.autoApproved) continue; // already counted if in confidence pool
      samples.push({
        composite: gen.qcComposite,
        operatorApproved: gen.id === chosen,
      });
    }
  }

  return samples;
}

function evaluateThreshold(samples: Sample[], threshold: number): {
  accuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
} {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  for (const s of samples) {
    const predicted = s.composite >= threshold;
    if (predicted && s.operatorApproved) tp++;
    else if (predicted && !s.operatorApproved) fp++;
    else if (!predicted && !s.operatorApproved) tn++;
    else fn++;
  }
  const total = samples.length || 1;
  const predictedPositives = tp + fp;
  const predictedNegatives = tn + fn;
  return {
    accuracy: (tp + tn) / total,
    falsePositiveRate: predictedPositives > 0 ? fp / predictedPositives : 0,
    falseNegativeRate: predictedNegatives > 0 ? fn / predictedNegatives : 0,
  };
}

async function runCalibrationFor(stylePreset: string) {
  const samples = await gatherSamplesForStyle(stylePreset);
  if (samples.length < MIN_SAMPLES) {
    console.log(`[calibration] ${stylePreset} — only ${samples.length} samples, need ${MIN_SAMPLES}, skip`);
    return;
  }

  const profile = await prisma.qcStyleProfile.findUnique({ where: { stylePreset } });
  if (!profile) return;

  const current = profile.compositeAutoApprove;
  const evaluations = CANDIDATE_THRESHOLDS.map((t) => ({
    threshold: t,
    ...evaluateThreshold(samples, t),
  }));

  const best = evaluations.reduce((a, b) => (b.accuracy > a.accuracy ? b : a));

  // Only propose if meaningfully different (>= 2 units) and better accuracy
  if (Math.abs(best.threshold - current) < 2) {
    console.log(`[calibration] ${stylePreset} — current ${current} already near-optimal`);
    return;
  }

  const currentEval = evaluateThreshold(samples, current);
  if (best.accuracy <= currentEval.accuracy + 0.02) {
    console.log(`[calibration] ${stylePreset} — no significant improvement`);
    return;
  }

  await prisma.qcCalibrationRun.create({
    data: {
      stylePreset,
      sampleSize: samples.length,
      currentThreshold: current,
      proposedThreshold: best.threshold,
      predictedAccuracy: best.accuracy,
      actualFpRate: best.falsePositiveRate,
      actualFnRate: best.falseNegativeRate,
      status: "pending",
    },
  });

  console.log(
    `[calibration] ${stylePreset} — proposal: ${current} → ${best.threshold} (accuracy ${(best.accuracy * 100).toFixed(1)}%)`,
  );
}

export const qcCalibrationWorker = new Worker<CalibrationJobData>(
  QUEUE_NAMES.qcCalibration,
  async (job) => {
    const styles = job.data.stylePreset ? [job.data.stylePreset] : STYLES;
    for (const style of styles) {
      await runCalibrationFor(style);
    }
  },
  { connection: redis, concurrency: 1 },
);

qcCalibrationWorker.on("failed", (job, err) =>
  console.error("[qc-calibration] failed", job?.id, err.message),
);
