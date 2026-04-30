import { NextResponse } from "next/server";
import { getVertex, getVertexImage } from "@wowcut/ai";

// Temporary debug route — remove after diagnosing generation failure
// ?path=vertex (default) or ?path=express
export async function GET(req: Request) {
  const apiKey = process.env.VERTEX_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "VERTEX_API_KEY not set" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") ?? "vertex";
  const ai = path === "express" ? getVertexImage() : getVertex();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [
        {
          role: "user",
          parts: [{ text: "Generate a simple red circle on a white background." }],
        },
      ],
      config: {
        responseModalities: ["IMAGE"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find(
      (p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data,
    );
    const textPart = parts.find((p: { text?: string }) => p.text);

    if (imagePart?.inlineData?.data) {
      return NextResponse.json({
        ok: true,
        path,
        mimeType: imagePart.inlineData.mimeType,
        byteLength: imagePart.inlineData.data.length,
      });
    }

    return NextResponse.json({
      ok: false,
      path,
      error: "no image in response",
      text: textPart?.text ?? null,
      partsCount: parts.length,
      finishReason: response.candidates?.[0]?.finishReason,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, path, error: (err as Error).message },
      { status: 500 },
    );
  }
}
