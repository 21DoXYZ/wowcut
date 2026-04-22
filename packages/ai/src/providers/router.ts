import type { GenerationModel } from "../prompts/presets";
import type { Provider } from "./index";
import { GeminiImageProvider } from "./gemini-image";
import { ImagenProvider } from "./imagen";
import { VeoProvider } from "./veo";

let cachedProviders: Provider[] | null = null;

function getProviders(): Provider[] {
  if (cachedProviders) return cachedProviders;
  cachedProviders = [new GeminiImageProvider(), new ImagenProvider(), new VeoProvider()];
  return cachedProviders;
}

export function routeProvider(model: GenerationModel): Provider {
  const providers = getProviders();
  const match = providers.find((p) => p.supports(model));
  if (!match) throw new Error(`No provider registered for model ${model}`);
  return match;
}

export function fallbackModel(model: GenerationModel): GenerationModel | null {
  switch (model) {
    case "nano_banana_2":
      return "nano_banana_2_hq"; // Gemini Image -> Imagen HQ
    case "nano_banana_2_hq":
      return "flux_pro"; // Imagen HQ -> Imagen Fast (mapped via flux_pro legacy enum)
    case "kling_v2":
    case "seedance_v2_pro":
      return "runway_gen3"; // Veo 3 -> Veo 2 (mapped via runway_gen3 legacy enum)
    default:
      return null;
  }
}
