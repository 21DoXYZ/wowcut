import type { CompiledPrompt } from "../prompts/compiler";
import type { GenerationModel, UnitFormat } from "../prompts/presets";

export interface GenerationJob {
  model: GenerationModel;
  compiled: CompiledPrompt;
  format: UnitFormat;
  aspectRatio: string;
}

export interface GenerationResult {
  outputUrl: string;
  latencyMs: number;
  costUsd: number;
  providerMeta: Record<string, unknown>;
}

export interface Provider {
  supports(model: GenerationModel): boolean;
  generate(job: GenerationJob): Promise<GenerationResult>;
}

export {
  GeminiImageProvider,
  generateGeminiImage,
  type GeminiImageCallInput,
  type GeminiImageCallResult,
  type GeminiImageReference,
} from "./gemini-image";
export { ImagenProvider, generateImagen } from "./imagen";
export {
  VeoProvider,
  startVeoJob,
  pollVeoJob,
  type VeoOperation,
  type VeoPollResult,
  type VeoStartInput,
} from "./veo";
export { routeProvider, fallbackModel } from "./router";
