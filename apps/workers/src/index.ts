import "dotenv/config";
import { previewWorker } from "./preview.worker";
import { generationWorker } from "./generation.worker";
import { qcWorker } from "./qc.worker";
import { qcCalibrationWorker } from "./qc-calibration.worker";
import { weekPassExpiryWorker } from "./week-pass-expiry.worker";
import { assemblyWorker } from "./assembly.worker";
import { deliveryWorker, scheduleWeeklyDelivery } from "./delivery.worker";
import { trendWorker, scheduleMonthlyTrend } from "./trend.worker";
import { veoPollWorker } from "./veo-poll.worker";
import { aiconBootstrapWorker } from "./aicon-bootstrap.worker";
import { aiconSceneWorker } from "./aicon-scene.worker";
import { aiconAnimateWorker } from "./aicon-animate.worker";
import { aiconAssemblyWorker } from "./aicon-assembly.worker";
import {
  deliveryQueue,
  trendQueue,
  qcCalibrationQueue,
  weekPassExpiryQueue,
} from "./queues";

async function scheduleWeeklyCalibration() {
  await qcCalibrationQueue.add(
    "weekly-qc-calibration",
    {},
    {
      repeat: { pattern: "0 3 * * 1" }, // Monday 03:00 UTC
      jobId: "weekly-qc-calibration",
    },
  );
}

async function scheduleHourlyExpiryCheck() {
  await weekPassExpiryQueue.add(
    "hourly-week-pass-expiry",
    {},
    {
      repeat: { pattern: "0 * * * *" }, // top of every hour
      jobId: "hourly-week-pass-expiry",
    },
  );
}

async function main() {
  console.log("[workers] starting…");

  await scheduleWeeklyDelivery(deliveryQueue);
  await scheduleMonthlyTrend(trendQueue);
  await scheduleWeeklyCalibration();
  await scheduleHourlyExpiryCheck();

  const workers = [
    ["preview", previewWorker],
    ["generation", generationWorker],
    ["qc", qcWorker],
    ["qc-calibration", qcCalibrationWorker],
    ["assembly", assemblyWorker],
    ["delivery", deliveryWorker],
    ["trend", trendWorker],
    ["week-pass-expiry", weekPassExpiryWorker],
    ["veo-poll", veoPollWorker],
    ["aicon-bootstrap", aiconBootstrapWorker],
    ["aicon-scene", aiconSceneWorker],
    ["aicon-animate", aiconAnimateWorker],
    ["aicon-assembly", aiconAssemblyWorker],
  ] as const;

  await Promise.all(
    workers.map(async ([name, w]) => {
      console.log(`[workers] ${name} ready`);
      w.on("completed", (job) => console.log(`[${name}] ✓`, job.id));
    }),
  );

  const shutdown = async (signal: string) => {
    console.log(`[workers] ${signal} — closing…`);
    await Promise.all(workers.map(([, w]) => w.close()));
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
