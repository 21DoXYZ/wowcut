/**
 * Upload base64 data-URI images to R2 and update generation.outputUrl.
 * Run after force-deliver when images are still stored as data:// URLs.
 *
 * Run:
 *   DATABASE_URL=... R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \
 *   R2_BUCKET_NAME=wowcut-media R2_PUBLIC_URL=https://pub-4f37be48a10f466ab836378db0909439.r2.dev \
 *   npx tsx scripts/upload-images-to-r2.ts
 */
import { PrismaClient } from "@prisma/client";
import { uploadObject, R2Keys } from "@wowcut/storage";

const prisma = new PrismaClient();
const CLIENT_ID = "cmoguoidl00004mghq0jy70i4";

async function main() {
  // Find all generations with data: URL outputs for this client
  const gens = await (prisma as any).$queryRawUnsafe(`
    SELECT g.id, g."outputUrl" as "outputUrl", c."stylePreset" as "stylePreset", c.format
    FROM public."Generation" g
    JOIN public."ContentPlanItem" c ON c.id = g."unitId"
    WHERE c."clientId" = '${CLIENT_ID}'
      AND g.status = 'succeeded'
      AND g."outputUrl" LIKE 'data:%'
  `);

  console.log(`Found ${gens.length} generations with data URLs`);

  for (const gen of gens) {
    const dataUrl: string = gen.outputUrl;
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) {
      console.log(`  skipping ${gen.id}: malformed data URL`);
      continue;
    }

    const mimeType = match[1];
    const base64 = match[2];
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const key = R2Keys.generation(gen.id, ext as "png" | "jpg");

    const body = Buffer.from(base64, "base64");
    const r2Url = await uploadObject({ key, body, contentType: mimeType });

    await prisma.generation.update({
      where: { id: gen.id },
      data: { outputUrl: r2Url },
    });

    console.log(`  uploaded ${gen.stylePreset}/${gen.format} → ${r2Url}`);
  }

  console.log("\n✅ All images uploaded to R2 and generation records updated.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
