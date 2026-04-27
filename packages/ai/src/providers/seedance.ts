/**
 * Seedance 2.0 video generation provider (Volcengine / ByteDance ModelArk)
 *
 * Docs:  https://www.volcengine.com/docs/82379/1520757
 * Auth:  BYTEPLUS_ARK_API_KEY   (format: ark-xxxx-xxxx-xxxx-xxxx-xxxx)
 * Base:  https://ark.cn-beijing.volces.com/api/v3
 *
 * Flow:
 *   1. POST /contents/generations/tasks  → { id, status: "submitted" }
 *   2. GET  /contents/generations/tasks/:id  → poll until status = "succeeded"
 *   3. On success: response.content.video_url  (expires 24h — upload to R2 asap)
 */

import { MODEL_COSTS_USD } from "@wowcut/shared";
import type { GenerationJob, GenerationResult, Provider } from "./index";
import type { GenerationModel } from "../prompts/presets";

const DEFAULT_BASE = "https://ark.ap-southeast.bytepluses.com/api/v3";

// Model IDs as of April 2026
export const SEEDANCE_MODELS = {
  pro:  "dreamina-seedance-2-0-260128",
  fast: "dreamina-seedance-2-0-fast-260128",
} as const;

export type SeedanceModel = keyof typeof SEEDANCE_MODELS;

export interface SeedanceStartInput {
  model?: SeedanceModel;
  prompt: string;
  /** e.g. "9:16" | "16:9" | "1:1" | "adaptive" */
  aspectRatio?: string;
  durationSeconds?: number;
  /** Public HTTPS URL for first-frame image-to-video */
  imageUrl?: string;
}

export interface SeedanceOperation {
  taskId: string;
  startedAt: string;
}

export interface SeedancePollResult {
  done: boolean;
  videoUrl?: string;
  error?: string;
}

function getApiKey(): string {
  const key = process.env.BYTEPLUS_ARK_API_KEY;
  if (!key) throw new Error("BYTEPLUS_ARK_API_KEY is not set");
  return key;
}

function getBase(): string {
  return (process.env.BYTEPLUS_ARK_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, "");
}

/** Map "9:16" → "9:16", pass unknown ratios through as-is */
function toSeedanceRatio(ratio?: string): string {
  if (!ratio) return "adaptive";
  // Seedance accepts "16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"
  return ratio;
}

/**
 * Submit a Seedance 2.0 video generation task.
 * Returns immediately with a taskId — poll with pollSeedanceJob().
 */
export async function startSeedanceJob(
  input: SeedanceStartInput,
): Promise<SeedanceOperation> {
  const apiKey = getApiKey();
  const base = getBase();

  const modelId = SEEDANCE_MODELS[input.model ?? "pro"];

  // Content array: text prompt + optional reference image
  const content: Record<string, unknown>[] = [
    { type: "text", text: input.prompt },
  ];

  if (input.imageUrl) {
    content.push({
      type: "image_url",
      image_url: { url: input.imageUrl },
      role: "reference_image",
    });
  }

  const body = {
    model: modelId,
    content,
    generate_audio: false,
    ratio: toSeedanceRatio(input.aspectRatio),
    duration: input.durationSeconds ?? 5,
    watermark: false,
  };

  const res = await fetch(`${base}/contents/generations/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Seedance create task failed ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as { id?: string; task_id?: string };
  const taskId = data.id ?? data.task_id;
  if (!taskId) throw new Error("Seedance API did not return a task ID");

  console.log(`[seedance] task created: ${taskId} (model=${modelId})`);
  return { taskId, startedAt: new Date().toISOString() };
}

/**
 * Poll a Seedance task. Returns { done: false } while still running.
 * On success returns videoUrl (Volcengine CDN URL, valid 24h — upload to R2 immediately).
 */
export async function pollSeedanceJob(taskId: string): Promise<SeedancePollResult> {
  const apiKey = getApiKey();
  const base = getBase();

  const res = await fetch(`${base}/contents/generations/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(`Seedance poll failed ${res.status}: ${await res.text().catch(() => "")}`);
  }

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    content?: { video_url?: string } | Array<{ type: string; video_url?: string }>;
    error?: { message?: string; code?: string } | string;
  };

  const status = (data.status ?? "running").toLowerCase();

  if (status === "submitted" || status === "running" || status === "processing" || status === "queued" || status === "pending") {
    return { done: false };
  }

  if (status === "failed" || status === "cancelled" || status === "canceled") {
    const errMsg =
      typeof data.error === "string"
        ? data.error
        : (data.error as { message?: string } | undefined)?.message ?? "Seedance task failed";
    return { done: true, error: errMsg };
  }

  // status === "succeeded"
  let videoUrl: string | undefined;
  if (Array.isArray(data.content)) {
    videoUrl = (data.content as Array<{ video_url?: string }>).find((c) => c.video_url)?.video_url;
  } else if (data.content && typeof data.content === "object") {
    videoUrl = (data.content as { video_url?: string }).video_url;
  }

  if (!videoUrl) {
    return { done: true, error: "Seedance succeeded but returned no video_url" };
  }

  console.log(`[seedance] task ${taskId} succeeded, video ready`);
  return { done: true, videoUrl };
}

export class SeedanceProvider implements Provider {
  supports(model: GenerationModel): boolean {
    return model === "kling_v2" || model === "seedance_v2_pro" || model === "runway_gen3";
  }

  async generate(job: GenerationJob): Promise<GenerationResult> {
    const started = Date.now();
    const op = await startSeedanceJob({
      model: "pro",
      prompt: job.compiled.prompt,
      aspectRatio: job.aspectRatio,
    });

    const estimatedSeconds = 5;
    const costUsd = (MODEL_COSTS_USD.seedance_v2_pro ?? 0.5) * estimatedSeconds;

    return {
      outputUrl: "",
      latencyMs: Date.now() - started,
      costUsd,
      providerMeta: {
        seedanceTaskId: op.taskId,
        asyncPending: true,
      },
    };
  }
}
