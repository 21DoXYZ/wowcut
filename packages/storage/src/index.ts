import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const BUCKET = process.env.R2_BUCKET_NAME ?? "wowcut-media";
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  if (!ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 credentials are not configured");
  }
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    // R2 supports both path-style and virtual-hosted; path-style avoids SNI
    // mismatches on some serverless runtimes.
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  return cachedClient;
}

export interface UploadInput {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export async function uploadObject(input: UploadInput): Promise<string> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl ?? "public, max-age=31536000",
      Metadata: input.metadata,
    }),
  );
  return publicUrl(input.key);
}

export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Delete every object under a prefix. Paginates through ListObjectsV2 and
 * batches DeleteObjects (max 1000 keys per call). Best-effort — errors on a
 * single batch are logged but don't abort the whole operation, since this is
 * usually called from cleanup paths where partial progress is fine.
 */
export async function deletePrefix(prefix: string): Promise<{ deleted: number }> {
  const client = getClient();
  let token: string | undefined;
  let deleted = 0;

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    const keys = listed.Contents?.map((o) => o.Key).filter((k): k is string => !!k) ?? [];
    if (keys.length > 0) {
      try {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: BUCKET,
            Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
          }),
        );
        deleted += keys.length;
      } catch (err) {
        console.error(`[storage] deletePrefix batch failed for ${prefix}:`, err);
      }
    }
    token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (token);

  return { deleted };
}

export async function objectExists(key: string): Promise<boolean> {
  const client = getClient();
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function createSignedDownloadUrl(key: string, expiresInSeconds = 60 * 60 * 24 * 7): Promise<string> {
  const client = getClient();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: expiresInSeconds,
  });
}

export async function createSignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const client = getClient();
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: params.key,
      ContentType: params.contentType,
    }),
    { expiresIn: params.expiresInSeconds ?? 60 * 10 },
  );
}

export function publicUrl(key: string): string {
  if (PUBLIC_URL) return `${PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  return `https://${BUCKET}.r2.cloudflarestorage.com/${key}`;
}

export const R2Keys = {
  preview: (previewId: string) => `previews/${previewId}.jpg`,
  sku: (slug: string, skuId: string) => `clients/${slug}/skus/${skuId}.jpg`,
  logo: (slug: string) => `clients/${slug}/logo.svg`,
  generation: (generationId: string, ext: "jpg" | "mp4" | "png") =>
    `generations/${generationId}.${ext}`,
  assembly: (unitId: string, format: string, ext: "jpg" | "mp4") =>
    `assembly/${unitId}/${format}.${ext}`,
  delivery: (slug: string, weekKey: string, filename: string) =>
    `deliveries/${slug}/${weekKey}/${filename}`,
  library: (slug: string, tag: string, filename: string) =>
    `library/${slug}/${tag}/${filename}`,
  brandFace: (faceId: string) => `brand-faces/${faceId}.jpg`,
  trendDrop: (monthKey: string, filename: string) => `trend-drops/${monthKey}/${filename}`,
  upload: (uploadId: string) => `uploads/${uploadId}`,
};
