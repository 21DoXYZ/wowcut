"use client";
import Image from "next/image";
import Link from "next/link";
import { Card, MonoLabel, Badge, Button } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

const STYLE_LABELS: Record<string, string> = {
  social_style: "Social Style",
  editorial_hero: "Editorial Hero",
  cgi_concept: "CGI Concept",
  fashion_campaign: "Fashion Campaign",
};

const PLACEHOLDER_GRADIENTS = [
  "bg-gradient-to-br from-[#1A1A1A] to-[#3E3E3E]",
  "bg-gradient-to-br from-[#86FF6B] to-[#FFE24B]",
  "bg-gradient-to-br from-[#7A3BFF] to-[#FF4BD4]",
  "bg-gradient-to-br from-[#FFE24B] to-[#FF4BD4]",
  "bg-gradient-to-br from-[#86FF6B] to-[#7A3BFF]",
  "bg-gradient-to-br from-[#FF4BD4] to-[#FFE24B]",
];

export default function GalleryPage() {
  const gallery = trpc.preview.gallery.useQuery({ limit: 24 });
  const items = gallery.data ?? [];

  return (
    <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16 md:py-24">
      <MonoLabel>Gallery</MonoLabel>
      <h1 className="mt-4 brand-heading">Examples from brands like yours</h1>
      <p className="mt-4 text-body-lg fw-330 text-ink/70 max-w-[52ch]">
        Real outputs from Wowcut - no post-processing, no cherry-picking.
      </p>

      <div className="mt-12 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {gallery.isLoading &&
          Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="p-0 overflow-hidden">
              <div className="aspect-[4/5] bg-ink/8 animate-pulse" />
              <div className="p-3">
                <div className="h-3 w-20 bg-ink/10 rounded animate-pulse" />
              </div>
            </Card>
          ))}

        {items.map(({ previewId, image }) => (
          <Link key={`${previewId}-${image.index}`} href={`/try/moodboard/${previewId}`}>
            <Card className="p-0 overflow-hidden group cursor-pointer hover:border-ink/30 transition-colors">
              <div className="aspect-[4/5] relative overflow-hidden">
                <Image
                  src={image.url}
                  alt={image.sceneHeadline}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="p-3 flex items-center gap-2">
                <MonoLabel size="sm">{STYLE_LABELS[image.stylePreset] ?? image.stylePreset}</MonoLabel>
                {image.qcComposite >= 0.9 && (
                  <Badge tone="ok" size="sm">Top pick</Badge>
                )}
              </div>
            </Card>
          </Link>
        ))}

        {!gallery.isLoading &&
          items.length < 12 &&
          Array.from({ length: Math.max(0, 12 - items.length) }).map((_, i) => (
            <Card key={`placeholder-${i}`} className="p-0 overflow-hidden">
              <div
                className={`aspect-[4/5] ${PLACEHOLDER_GRADIENTS[(i + items.length) % PLACEHOLDER_GRADIENTS.length]}`}
              />
              <div className="p-3">
                <MonoLabel size="sm" className="text-ink/30">Coming soon</MonoLabel>
              </div>
            </Card>
          ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-body fw-330 text-ink/60 mb-4">
          See your brand in these styles - free, no signup.
        </p>
        <Link href="/try">
          <Button variant="black">Generate your free moodboard</Button>
        </Link>
      </div>
    </section>
  );
}
