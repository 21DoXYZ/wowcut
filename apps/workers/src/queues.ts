// Workers and the API share the same queue instances via @wowcut/queues.
import { queues } from "@wowcut/queues";

const q = queues();

export const previewQueue = q.previewQueue;
export const generationQueue = q.generationQueue;
export const qcQueue = q.qcQueue;
export const qcCalibrationQueue = q.qcCalibrationQueue;
export const assemblyQueue = q.assemblyQueue;
export const deliveryQueue = q.deliveryQueue;
export const trendQueue = q.trendQueue;
export const onboardingCleanupQueue = q.onboardingCleanupQueue;
export const weekPassExpiryQueue = q.weekPassExpiryQueue;
export const veoPollQueue = q.veoPollQueue;
export const aiconBootstrapQueue = q.aiconBootstrapQueue;
export const aiconSceneQueue = q.aiconSceneQueue;
export const aiconAnimateQueue = q.aiconAnimateQueue;
export const aiconAssemblyQueue = q.aiconAssemblyQueue;

export {
  enqueuePreview,
  enqueuePilotMinimum,
  enqueueWeeklyBatch,
  enqueueRetry,
  enqueueAssembly,
  enqueueQc,
  enqueueVeoPoll,
  enqueueAiconBootstrap,
  enqueueAiconScene,
  enqueueAiconAnimate,
  enqueueAiconAssembly,
} from "@wowcut/queues";
