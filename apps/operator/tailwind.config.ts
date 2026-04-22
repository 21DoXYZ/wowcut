import type { Config } from "tailwindcss";
import { wowcutTailwindPreset } from "@wowcut/ui/tailwind-preset";

const config: Config = {
  presets: [wowcutTailwindPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};
export default config;
