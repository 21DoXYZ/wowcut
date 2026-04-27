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
  for (const candidate of ["chromium", "chromium-browser", "google-chrome-stable", "google-chrome"]) {
    try {
      const p = execSync(`which ${candidate} 2>/dev/null`, { encoding: "utf8" }).trim();
      if (p) return p;
    } catch {
      // not found
    }
  }
  return undefined;
}

const CHROMIUM_PATH = getChromiumExecutablePath();

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

  const puppeteerExecutable = CHROMIUM_PATH ? { executablePath: CHROMIUM_PATH } : undefined;

  const composition = await selectComposition({
    serveUrl,
    id: input.compositionId,
    inputProps: input.inputProps,
    ...(puppeteerExecutable ? { puppeteerExecutable } : {}),
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
      ...(puppeteerExecutable ? { puppeteerExecutable } : {}),
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
    ...(puppeteerExecutable ? { puppeteerExecutable } : {}),
  });

  return {
    filePath: outputPath,
    mimeType: "video/mp4",
    durationMs: Date.now() - started,
  };
}
