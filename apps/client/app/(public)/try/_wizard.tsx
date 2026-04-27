"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  usedFor: string;
  format: string;
  main: string;
  thumbs: [string, string];
}[] = [
  {
    id: "social_style",
    name: "Social style",
    tag: "Most popular",
    description: "Real-life feel. Natural light, lifestyle props, scroll-stopping native content.",
    usedFor: "Instagram, TikTok, Stories",
    format: "4:5",
    main: "/style-refs/social/4.jpeg",
    thumbs: ["/style-refs/social/1.jpeg", "/style-refs/social/2.png"],
  },
  {
    id: "editorial_hero",
    name: "Editorial hero",
    tag: "Clean & sharp",
    description: "Studio-grade. Color-matched background, perfect lighting, product as the star.",
    usedFor: "Website, Amazon, ads",
    format: "1:1",
    main: "/style-refs/editorial/2.png",
    thumbs: ["/style-refs/editorial/1.png", "/style-refs/editorial/4.png"],
  },
  {
    id: "cgi_concept",
    name: "CGI concept",
    tag: "Stands out",
    description: "Impossible environments. Product at city scale, billboard takeover, arctic scenes.",
    usedFor: "Campaign hero, brand awareness",
    format: "9:16",
    main: "/style-refs/cgi/2.png",
    thumbs: ["/style-refs/cgi/1.png", "/style-refs/cgi/4.png"],
  },
  {
    id: "fashion_campaign",
    name: "With model",
    tag: "Premium",
    description: "Your product on a person. Aspirational, editorial art direction, brand-story feel.",
    usedFor: "Fashion, beauty, lifestyle",
    format: "4:5",
    main: "/style-refs/fashion/1.png",
    thumbs: ["/style-refs/fashion/2.png", "/style-refs/fashion/3.jpeg"],
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
    step === 2 || // references are optional
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
              Any reference images? <span className="text-ink/35 fw-340">(optional)</span>
            </h2>
            <p className="mt-2 text-[15px] fw-340 tracking-[-0.14px] text-ink/70 leading-[1.5] max-w-[52ch]">
              Show us photos you like — a competitor, a vibe, a brand aesthetic. We use it to match the feel. Skip if you don't have any.
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
              Pick your style
            </h2>
            <p className="mt-2 text-[15px] fw-340 tracking-[-0.14px] text-ink/70 leading-[1.5] max-w-[52ch]">
              Select one or more - we generate 2-3 variations per style. You can see real examples below each card.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {STYLES.map((style) => {
                const selected = selectedStyles.includes(style.id);
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => toggleStyle(style.id)}
                    className={[
                      "text-left rounded-[16px] overflow-hidden border-2 transition-all",
                      selected
                        ? "border-ink shadow-[0_0_0_3px_rgba(0,0,0,0.08)]"
                        : "border-ink/10 hover:border-ink/30",
                    ].join(" ")}
                  >
                    {/* image area */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-ink/5">
                      <Image
                        src={style.main}
                        alt={style.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 280px"
                      />
                      {/* selected checkmark */}
                      {selected && (
                        <div className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-ink flex items-center justify-center shadow-md">
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                      )}
                      {/* thumb strip */}
                      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/50 to-transparent flex items-end gap-1.5 p-2">
                        {style.thumbs.map((img, i) => (
                          <div key={i} className="relative h-10 w-8 rounded-[5px] overflow-hidden flex-shrink-0 border border-white/25">
                            <Image src={img} alt="" fill className="object-cover" sizes="32px" />
                          </div>
                        ))}
                        <span className="ml-auto text-[9px] fw-540 tracking-[0.3px] uppercase text-white/70 pb-0.5">{style.format}</span>
                      </div>
                    </div>

                    {/* text */}
                    <div className={["p-3 transition-colors", selected ? "bg-ink/[0.04]" : "bg-paper"].join(" ")}>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[14px] fw-540 tracking-[-0.2px] text-ink leading-tight">
                          {style.name}
                        </span>
                        <span className={[
                          "shrink-0 text-[9px] fw-540 tracking-[0.3px] uppercase px-1.5 py-0.5 rounded-full mt-0.5",
                          selected ? "bg-ink text-paper" : "bg-ink/8 text-ink/50",
                        ].join(" ")}>
                          {selected ? "On" : style.tag}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] fw-330 tracking-[-0.1px] text-ink/60 leading-[1.4]">
                        {style.usedFor}
                      </p>
                    </div>
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
