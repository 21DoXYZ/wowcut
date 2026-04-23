import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { uploadObject, publicUrl, R2Keys } from "@wowcut/storage";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function r2Configured(): boolean {
  const id = process.env.R2_ACCOUNT_ID ?? "";
  // A real Cloudflare Account ID is a 32-char hex string, not a JWT
  return id.length > 0 && id.length < 64 && !id.startsWith("ey");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const uploadId = randomUUID();
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const arrayBuffer = await file.arrayBuffer();

    // Local dev fallback: if R2 is not properly configured, return a data URL
    // so the wizard preview works without R2 credentials.
    if (!r2Configured()) {
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;
      return NextResponse.json({ uploadId, url: dataUrl });
    }

    const key = `${R2Keys.upload(uploadId)}.${ext}`;
    const url = await uploadObject({
      key,
      body: Buffer.from(arrayBuffer),
      contentType: file.type,
    });

    return NextResponse.json({ uploadId, url: url ?? publicUrl(key) });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Upload failed" },
      { status: 500 },
    );
  }
}
