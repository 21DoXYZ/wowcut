import fs from "node:fs/promises";
import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@wowcut/shared";
import { prisma } from "@wowcut/db";
import { uploadObject, R2Keys } from "@wowcut/storage";
import { redis } from "./redis";
import { renderComposition } from "./remotion-render";
import { mapUnitToComposition } from "./assembly-mapping";

export interface AssemblyJobData {
  unitId: string;
}

export const assemblyWorker = new Worker<AssemblyJobData>(
  QUEUE_NAMES.assembly,
  async (job) => {
    const unit = await prisma.contentPlanItem.findUnique({
      where: { id: job.data.unitId },
      include: { chosenGeneration: true, client: true, sku: true },
    });
    if (!unit || !unit.chosenGeneration?.outputUrl) return;

    await prisma.contentPlanItem.update({
      where: { id: unit.id },
      data: { status: "assembling" },
    });

    const mapping = mapUnitToComposition({
      stylePreset: unit.stylePreset,
      format: unit.format,
      imageUrl: unit.chosenGeneration.outputUrl,
      brandName: unit.client.name,
      brandColor: unit.client.brandColors[0] ?? "#000000",
      productName: unit.sku.name,
      caption: `${unit.sku.name} — ${unit.stylePreset.replace(/_/g, " ")}`,
      ctaText: "Shop now",
    });

    const ext = mapping.kind === "still" ? "jpg" : "mp4";
    const primaryKey = R2Keys.assembly(unit.id, unit.format, ext);

    const render = await renderComposition({
      compositionId: mapping.compositionId,
      inputProps: mapping.inputProps,
      kind: mapping.kind,
      outputKey: primaryKey,
    });

    let deliveredUrl: string;
    try {
      const body = await fs.readFile(render.filePath);
      deliveredUrl = await uploadObject({
        key: primaryKey,
        body,
        contentType: render.mimeType,
      });
    } finally {
      await fs.unlink(render.filePath).catch(() => {});
    }

    await prisma.generation.update({
      where: { id: unit.chosenGeneration.id },
      data: { outputUrl: deliveredUrl },
    });

    await prisma.contentPlanItem.update({
      where: { id: unit.id },
      data: { status: "delivered", assemblyJobId: job.id?.toString() },
    });

    await prisma.libraryItem.upsert({
      where: { unitId: unit.id },
      update: {},
      create: {
        clientId: unit.clientId,
        unitId: unit.id,
        tags: unit.tags,
      },
    });
  },
  { connection: redis, concurrency: 2 },
);

assemblyWorker.on("failed", (job, err) => console.error("[assembly] failed", job?.id, err.message));
