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
  previewUrl: string;
}

type StylePreset = "social_style" | "editorial_hero" | "cgi_concept" | "fashion_campaign";

const STYLES: {
  id: StylePreset;
  name: string;
  tag: string;
  description: string;
  format: string;
}[] = [
  {
    id: "social_style",
    name: "Social Reel",
    tag: "Most popular",
    description: "Lifestyle energy, authentic movement, platform-native feel.",
    format: "9:16 vertical",
  },
  {
    id: "editorial_hero",
    name: "Editorial Hero",
    tag: "Clean & premium",
    description: "Studio-precise product focus. Geometry, texture, packaging.",
    format: "1:1 square",
  },
  {
    id: "cgi_concept",
    name: "CGI Concept",
    tag: "Standout",
    description: "Hyper-real 3D worlds. Impossible scenes, scale hyperbole.",
    format: "9:16 vertical",
  },
  {
    id: "fashion_campaign",
    name: "Fashion Campaign",
    tag: "Premium",
    description: "Styled scene with model. Brand storytelling through pose and light.",
    format: "4:5 portrait",
  },
];

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

async function uploadFile(file: File): Promise<UploadedImage> {
  const previewUrl = URL.createObjectURL(file);
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    URL.revokeObjectURL(previewUrl);
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Upload failed");
  }
  const data = (await res.json()) as { uploadId: string; url: string };
  return { ...data, previewUrl };
}

export function TryWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<UploadedImage[]>([]);
  const [references, setReferences] = useState<UploadedImage[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<StylePreset[]>(["social_style", "editorial_hero"]);
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

  function toggleStyle(id: StylePreset) {
    setSelectedStyles((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== id);
      }
      return [...prev, id];
    });
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
          selectedStyles,
        },
      });
      router.push(`/try/moodboard/${result.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  const TOTAL_STEPS = 4;
  const STEP_LABELS = ["Products", "References", "Styles", "Brand color"];

  const canContinue =
    (step === 1 && products.length >= 1) ||
    (step === 2 && references.length >= 1) ||
    (step === 3 && selectedStyles.length >= 1) ||
    (step === 4 && /^#[0-9A-Fa-f]{6}$/.test(brandColor));

  return (
    <Card variant="elevated" noPadding className="overflow-hidden">
      <div className="p-6 md:p-8 border-b border-ink/6">
        <div className="flex items-center justify-between mb-4">
          <MonoLabel size="sm" className="text-ink/55">Step {step} of {TOTAL_STEPS}</MonoLabel>
          <MonoLabel size="sm" className="text-ink/40">{STEP_LABELS[step - 1]}</MonoLabel>
        </div>
        <Stepper current={step} total={TOTAL_STEPS} />
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
                items={products.map((p) => ({ id: p.uploadId, url: p.previewUrl }))}
                onRemove={(id) => setProducts((p) => p.filter((x) => x.uploadId !== id))}
                columns={3}
                className="col-span-3"
              />
              {products.length < 3 && (
                <div className="col-span-3">
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
              Drop 1-5 inspiration images — moods, lighting, aesthetics that feel like you.
            </p>

            <div className="mt-6">
              <UploadPreviewGrid
                items={references.map((r) => ({ id: r.uploadId, url: r.previewUrl }))}
                onRemove={(id) => setReferences((r) => r.filter((x) => x.uploadId !== id))}
                columns={5}
                className="mb-3"
              />
              {references.length < 5 && (
                <UploadZone
                  label={references.length === 0 ? "Drop inspiration images" : "Add another reference"}
                  hint="Up to 5 images · the more different, the better we learn your taste"
                  multiple
                  onFiles={handleReferenceFiles}
                  size="md"
                />
              )}
            </div>

            <p className="mt-4 text-[12px] fw-330 tracking-[-0.14px] text-ink/50">
              {references.length}/5 added
            </p>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-[24px] md:text-[28px] fw-540 tracking-[-0.5px] text-ink leading-[1.15]">
              Pick your content styles
            </h2>
            <p className="mt-2 text-[15px] fw-340 tracking-[-0.14px] text-ink/70 leading-[1.5] max-w-[52ch]">
              Choose one or more. We&rsquo;ll generate your moodboard in every style you pick.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STYLES.map((style) => {
                const selected = selectedStyles.includes(style.id);
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => toggleStyle(style.id)}
                    className={[
                      "text-left p-4 rounded-xl border-2 transition-all",
                      selected
                        ? "border-ink bg-ink/5"
                        : "border-ink/12 hover:border-ink/30",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[15px] fw-540 tracking-[-0.2px] text-ink">
                        {style.name}
                      </span>
                      <span className={[
                        "shrink-0 mt-0.5 text-[10px] fw-540 tracking-[0.4px] uppercase px-2 py-0.5 rounded-full",
                        selected ? "bg-ink text-paper" : "bg-ink/8 text-ink/55",
                      ].join(" ")}>
                        {selected ? "Selected" : style.tag}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] fw-330 tracking-[-0.14px] text-ink/65 leading-[1.4]">
                      {style.description}
                    </p>
                    <p className="mt-2 text-[11px] fw-430 tracking-[0.2px] text-ink/40 uppercase">
                      {style.format}
                    </p>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-[12px] fw-330 tracking-[-0.14px] text-ink/50">
              {selectedStyles.length} style{selectedStyles.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        )}

        {step === 4 && (
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
          {step < TOTAL_STEPS ? (
            <Button
              variant="black"
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
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
