import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { execSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import {
  selectComposition,
  renderMedia,
  renderStill,
  type RenderMediaOnProgress,
} from "@remotion/renderer";

let cachedBundleUrl: string | null = null;

const ENTRY_POINT = path.resolve(__dirname, "../../remotion/src/index.ts");

// Use system chromium if available (nixpacks installs it), otherwise Remotion downloads its own
function getChromiumExecutablePath(): string | undefined {
  if (process.env.CHROMIUM_EXECUTABLE_PATH) return process.env.CHROMIUM_EXECUTABLE_PATH;

  // Check well-known binary names in PATH
  const names = ["chromium", "chromium-browser", "google-chrome-stable", "google-chrome"];
  for (const candidate of names) {
    try {
      const p = execSync(`which ${candidate} 2>/dev/null`, { encoding: "utf8" }).trim();
      if (p) return p;
    } catch {
      // not found
    }
  }

  // Check common fixed paths (nixpacks/nix/apt)
  const fixedPaths = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/snap/bin/chromium",
    "/nix/var/nix/profiles/default/bin/chromium",
    "/run/current-system/sw/bin/chromium",
  ];
  for (const p of fixedPaths) {
    try {
      execSync(`test -x ${p}`, { stdio: "ignore" });
      return p;
    } catch {
      // not found
    }
  }

  return undefined;
}

const CHROMIUM_PATH = getChromiumExecutablePath();

console.log("[remotion] chromium path:", CHROMIUM_PATH ?? "(will use Remotion bundled)");
console.log("[remotion] entry point:", ENTRY_POINT);

export async function warmBundle(): Promise<void> {
  await getBundleUrl();
}

async function getBundleUrl(): Promise<string> {
  if (cachedBundleUrl) return cachedBundleUrl;
  console.log("[remotion] bundling compositions from", ENTRY_POINT);
  cachedBundleUrl = await bundle({
    entryPoint: ENTRY_POINT,
    onProgress: (p) => {
      if (p % 25 === 0) console.log(`[remotion] bundle ${p}%`);
    },
  });
  console.log("[remotion] bundle ready at", cachedBundleUrl);
  return cachedBundleUrl;
}

export interface RemotionRenderInput {
  compositionId: string;
  inputProps: Record<string, unknown>;
  kind: "still" | "video";
  outputKey: string;
  onProgress?: RenderMediaOnProgress;
}

export interface RemotionRenderOutput {
  filePath: string;
  mimeType: string;
  durationMs: number;
}

export async function renderComposition(
  input: RemotionRenderInput,
): Promise<RemotionRenderOutput> {
  const started = Date.now();
  const serveUrl = await getBundleUrl();

  const composition = await selectComposition({
    serveUrl,
    id: input.compositionId,
    inputProps: input.inputProps,
    browserExecutable: CHROMIUM_PATH,
  });

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "wowcut-remotion-"));
  const ext = input.kind === "still" ? "jpeg" : "mp4";
  const outputPath = path.join(tmpDir, `out.${ext}`);

  if (input.kind === "still") {
    await renderStill({
      composition,
      serveUrl,
      inputProps: input.inputProps,
      output: outputPath,
      imageFormat: "jpeg",
      jpegQuality: 88,
      browserExecutable: CHROMIUM_PATH,
    });
    return {
      filePath: outputPath,
      mimeType: "image/jpeg",
      durationMs: Date.now() - started,
    };
  }

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: input.inputProps,
    imageFormat: "jpeg",
    jpegQuality: 88,
    pixelFormat: "yuv420p",
    onProgress: input.onProgress,
    browserExecutable: CHROMIUM_PATH,
  });

  return {
    filePath: outputPath,
    mimeType: "video/mp4",
    durationMs: Date.now() - started,
  };
}
