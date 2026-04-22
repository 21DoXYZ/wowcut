import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
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
