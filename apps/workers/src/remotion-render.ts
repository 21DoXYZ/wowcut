import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { bundle } from "@remotion/bundler";
import {
  selectComposition,
  renderMedia,
  renderStill,
  type RenderMediaOnProgress,
} from "@remotion/renderer";

let cachedBundleUrl: string | null = null;

const ENTRY_POINT = path.resolve(__dirname, "../../../packages/remotion/src/index.ts");

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
  });

  return {
    filePath: outputPath,
    mimeType: "video/mp4",
    durationMs: Date.now() - started,
  };
}
