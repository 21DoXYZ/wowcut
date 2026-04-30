import { NextResponse } from "next/server";
import { getVertex, getVertexImage } from "@wowcut/ai";

// Temporary debug route — tests which image generation model works with the current API key
export async function GET() {
  const candidates = [
    { model: "gemini-2.0-flash-preview-image-generation", client: "vertex" },
    { model: "gemini-2.0-flash-preview-image-generation", client: "express" },
    { model: "gemini-2.0-flash-exp", client: "vertex" },
    { model: "gemini-2.0-flash-exp", client: "express" },
    { model: "gemini-2.0-flash", client: "vertex" },
    { model: "gemini-2.0-flash", client: "express" },
    { model: "imagen-3.0-fast-generate-001", client: "express" },
  ];

  const results: Record<string, unknown>[] = [];

  for (const { model, client } of candidates) {
    const ai = client === "express" ? getVertexImage() : getVertex();
    try {
      if (model.startsWith("imagen")) {
        const response = await (ai.models as unknown as { generateImages: (opts: unknown) => Promise<{ generatedImages?: { image?: { imageBytes?: string } }[] }> }).generateImages({
          model,
          prompt: "A red circle on a white background.",
          config: { numberOfImages: 1, aspectRatio: "1:1" },
        });
        const bytes = response.generatedImages?.[0]?.image?.imageBytes;
        results.push({ model, client, ok: !!bytes, byteLength: bytes?.length ?? 0 });
      } else {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: "Generate a simple red circle on a white background." }] }],
          config: { responseModalities: ["IMAGE"] },
        });
        const parts = response.candidates?.[0]?.content?.parts ?? [];
        const img = parts.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data);
        const txt = parts.find((p: { text?: string }) => p.text);
        results.push({ model, client, ok: !!img, byteLength: img?.inlineData?.data?.length ?? 0, text: txt?.text?.slice(0, 100) ?? null });
      }
    } catch (err) {
      results.push({ model, client, ok: false, error: (err as Error).message.slice(0, 200) });
    }
  }

  return NextResponse.json(results);
}
