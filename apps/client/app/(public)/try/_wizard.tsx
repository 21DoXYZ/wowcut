"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Input,
  Label,
  MonoLabel,
  Stepper,
  UploadZone,
  UploadPreviewGrid,
  FieldError,
} from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

interface UploadedImage {
  uploadId: string;
  url: string;
}

async function uploadFile(file: File): Promise<UploadedImage> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Upload failed");
  }
  return (await res.json()) as UploadedImage;
}

const PALETTE_PRESETS = [
  "#0A0A0A",
  "#7A5A3A",
  "#D9C7B4",
  "#F4E7D8",
  "#E8B4A6",
  "#9FB7A3",
  "#2B3A55",
  "#8A6BE6",
];

export function TryWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<UploadedImage[]>([]);
  const [references, setReferences] = useState<UploadedImage[]>([]);
  const [brandColor, setBrandColor] = useState<string>("#111111");
  const [brandName, setBrandName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = trpc.preview.create.useMutation();

  async function handleProductFiles(files: File[]) {
    setError(null);
    const remaining = 3 - products.length;
    for (const file of files.slice(0, remaining)) {
      try {
        const up = await uploadFile(file);
        setProducts((p) => [...p, up]);
      } catch (err) {
        setError((err as Error).message);
      }
    }
  }

  async function handleReferenceFiles(files: File[]) {
    setError(null);
    const remaining = 5 - references.length;
    for (const file of files.slice(0, remaining)) {
      try {
        const up = await uploadFile(file);
        setReferences((r) => [...r, up]);
      } catch (err) {
        setError((err as Error).message);
      }
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const ipHash =
        typeof window !== "undefined" ? btoa(navigator.userAgent).slice(0, 32) : "server";
      const result = await create.mutateAsync({
        ipHash,
        intake: {
          brandName: brandName || undefined,
          products: products.map((p) => ({ uploadId: p.uploadId, imageUrl: p.url })),
          references: references.map((r) => ({
            uploadId: r.uploadId,
            imageUrl: r.url,
            source: "user_upload" as const,
          })),
          brandColor,
        },
      });
      router.push(`/try/moodboard/${result.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  const canContinue =
    (step === 1 && products.length >= 1) ||
    (step === 2 && references.length >= 3) ||
    (step === 3 && /^#[0-9A-Fa-f]{6}$/.test(brandColor));

  return (
    <Card variant="elevated" noPadding className="overflow-hidden">
      <div className="p-6 md:p-8 border-b border-ink/6">
        <div className="flex items-center justify-between mb-4">
          <MonoLabel size="sm" className="text-ink/55">Step {step} of 3</MonoLabel>
          <MonoLabel size="sm" className="text-ink/40">{["Products", "References", "Brand color"][step - 1]}</MonoLabel>
        </div>
        <Stepper current={step} total={3} />
      </div>

      <div className="p-6 md:p-8">
        {step === 1 && (
          <div>
            <h2 className="text-[24px] md:text-[28px] fw-540 tracking-[-0.5px] text-ink leading-[1.15]">
              Upload 1-3 product photos
            </h2>
            <p className="mt-2 text-[15px] fw-340 tracking-[-0.14px] text-ink/70 leading-[1.5] max-w-[52ch]">
              Clean shots work best — plain backgrounds, good light. We&rsquo;ll handle the rest.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <UploadPreviewGrid
                items={products.map((p) => ({ id: p.uploadId, url: p.url }))}
                onRemove={(id) => setProducts((p) => p.filter((x) => x.uploadId !== id))}
                columns={3}
                className="col-span-3"
              />
              {products.length < 3 && (
                <div className={products.length > 0 ? "col-span-3" : "col-span-3"}>
                  <UploadZone
                    label={products.length === 0 ? "Drop product photos here" : "Add another"}
                    hint="JPG, PNG or WEBP · up to 10MB each"
                    multiple
                    onFiles={handleProductFiles}
                    size="lg"
                  />
                </div>
              )}
            </div>

            <div className="mt-6">
              <Label htmlFor="brand" hint="optional">Brand name</Label>
              <Input
                id="brand"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Your brand"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-[24px] md:text-[28px] fw-540 tracking-[-0.5px] text-ink leading-[1.15]">
              Show us the vibe
            </h2>
            <p className="mt-2 text-[15px] fw-340 tracking-[-0.14px] text-ink/70 leading-[1.5] max-w-[52ch]">
              Drop 3-5 inspiration images — moods, lighting, aesthetics that feel like you.
            </p>

            <div className="mt-6">
              <UploadPreviewGrid
                items={references.map((r) => ({ id: r.uploadId, url: r.url }))}
                onRemove={(id) => setReferences((r) => r.filter((x) => x.uploadId !== id))}
                columns={5}
                className="mb-3"
              />
              {references.length < 5 && (
                <UploadZone
                  label={references.length === 0 ? "Drop inspiration images" : "Add another reference"}
                  hint="3-5 images · the more different, the better we learn your taste"
                  multiple
                  onFiles={handleReferenceFiles}
                  size="md"
                />
              )}
            </div>

            <p className="mt-4 text-[12px] fw-330 tracking-[-0.14px] text-ink/50">
              {references.length}/5 added · minimum 3 to continue
            </p>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-[24px] md:text-[28px] fw-540 tracking-[-0.5px] text-ink leading-[1.15]">
              Pick your brand color
            </h2>
            <p className="mt-2 text-[15px] fw-340 tracking-[-0.14px] text-ink/70 leading-[1.5] max-w-[52ch]">
              We&rsquo;ll ground the generated scenes in this palette.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <label className="relative shrink-0 h-14 w-14 rounded-xl border border-ink/15 overflow-hidden cursor-pointer hover:border-ink/40 transition-colors">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  aria-hidden
                  className="block h-full w-full"
                  style={{ backgroundColor: brandColor }}
                />
              </label>
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                maxLength={7}
                className="uppercase font-mono tracking-[0.4px]"
              />
            </div>

            <div className="mt-5">
              <MonoLabel size="sm" className="text-ink/55 mb-3 block">Suggestions</MonoLabel>
              <div className="flex flex-wrap gap-2">
                {PALETTE_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBrandColor(c)}
                    className="h-9 w-9 rounded-full border-2 border-paper shadow-[0_0_0_1px_rgba(0,0,0,0.1)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.12)] transition-shadow"
                    style={{ backgroundColor: c }}
                    aria-label={`Use ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <FieldError>{error}</FieldError>}

        <div className="mt-8 pt-6 border-t border-ink/6 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))}>
              ← Back
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button
              variant="black"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={!canContinue}
            >
              Continue →
            </Button>
          ) : (
            <Button
              variant="black"
              size="lg"
              loading={submitting}
              onClick={handleSubmit}
              disabled={!canContinue}
            >
              Generate my moodboard
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
