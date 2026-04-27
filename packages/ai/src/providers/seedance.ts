/**
 * Seedance 2.0 video generation provider (BytePlus ModelArk)
 *
 * API: https://docs.byteplus.com/en/docs/ModelArk/1520757
 * Auth: BYTEPLUS_ARK_API_KEY env var
 * Base: BYTEPLUS_ARK_BASE_URL env var (defaults to AP-Southeast region)
 *
 * Flow:
 *   1. POST  /contents/generations/videos  → { id, status }
 *   2. GET   /contents/generations/videos/:id  → poll until status = "succeeded"
 *   3. On success: content[].video_url contains the final video
 */

import { MODEL_COSTS_USD } from "@wowcut/shared";
import type { GenerationJob, GenerationResult, Provider } from "./index";
import type { GenerationModel } from "../prompts/presets";

// BytePlus ModelArk AP-Southeast region (change to EU/US if needed)
const DEFAULT_BASE = "https://ark.ap-southeast.bytepluses.com/api/v3";

export type SeedanceModel = "seedance-2.0-pro" | "seedance-2.0" | "seedance-2.0-fast";

export interface SeedanceStartInput {
  model: SeedanceModel;
  prompt: string;
  aspectRatio: string;
  durationSeconds?: number;
  /** Public HTTPS URL of the first-frame reference image (image-to-video) */
  imageUrl?: string;
}

export interface SeedanceOperation {
  taskId: string;
  startedAt: string;
}

export interface SeedancePollResult {
  done: boolean;
  videoUrl?: string;
  costUsd?: number;
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

/**
 * Submit a Seedance video generation task.
 * Returns a task ID to poll later — never blocks for the full generation.
 */
export async function startSeedanceJob(
  input: SeedanceStartInput,
): Promise<SeedanceOperation> {
  const apiKey = getApiKey();
  const base = getBase();

  // Build content array: [optional image, text prompt]
  const content: Record<string, unknown>[] = [];

  if (input.imageUrl) {
    content.push({
      type: "image_url",
      image_url: { url: input.imageUrl },
    });
  }

  content.push({ type: "text", text: input.prompt });

  const body = {
    model: input.model,
    content,
    parameters: {
      ratio: input.aspectRatio,
      duration: input.durationSeconds ?? 5,
      watermark: false,
    },
  };

  const res = await fetch(`${base}/contents/generations/videos`, {
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
  if (!taskId) {
    throw new Error("Seedance API did not return a task ID");
  }

  return { taskId, startedAt: new Date().toISOString() };
}

/**
 * Poll a Seedance task. Returns { done: false } while still running.
 * On success returns videoUrl (publicly accessible HTTPS URL).
 */
export async function pollSeedanceJob(taskId: string): Promise<SeedancePollResult> {
  const apiKey = getApiKey();
  const base = getBase();

  const res = await fetch(`${base}/contents/generations/videos/${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(`Seedance poll failed ${res.status}`);
  }

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    content?: Array<{ type: string; video_url?: { url: string } }>;
    error?: { message?: string } | string;
    output?: { video_url?: string };
  };

  const status = data.status ?? "running";

  if (status === "submitted" || status === "running" || status === "processing" || status === "pending") {
    return { done: false };
  }

  if (status === "failed" || status === "cancelled") {
    const errMsg =
      typeof data.error === "string"
        ? data.error
        : (data.error as { message?: string } | undefined)?.message ?? "Seedance task failed";
    return { done: true, error: errMsg };
  }

  // status === "succeeded" | "completed"
  // Try both response shapes
  const videoUrl =
    data.content?.find((c) => c.type === "video_url")?.video_url?.url ??
    data.output?.video_url;

  if (!videoUrl) {
    return { done: true, error: "Seedance completed but returned no video URL" };
  }

  return { done: true, videoUrl };
}

export class SeedanceProvider implements Provider {
  supports(model: GenerationModel): boolean {
    return model === "kling_v2" || model === "seedance_v2_pro" || model === "runway_gen3";
  }

  async generate(job: GenerationJob): Promise<GenerationResult> {
    const started = Date.now();
    const op = await startSeedanceJob({
      model: "seedance-2.0-pro",
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
