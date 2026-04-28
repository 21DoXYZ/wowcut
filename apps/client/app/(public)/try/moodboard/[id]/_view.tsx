"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { Button, Card, MonoLabel, Badge, Progress } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

interface MoodboardImage {
  index: number;
  stylePreset: "social_style" | "editorial_hero" | "cgi_concept";
  sceneId: string;
  sceneHeadline: string;
  url: string;
  seed: number;
  qcComposite: number;
  videoUrl?: string; // Remotion-rendered reel, present on first image of each style
}

const STYLE_LABELS: Record<string, { title: string; tag: string }> = {
  social_style: { title: "Social Style", tag: "Instagram · TikTok" },
  editorial_hero: { title: "Editorial Hero", tag: "Catalog · PDP" },
  cgi_concept: { title: "CGI Concept", tag: "Hero · Campaign" },
};

const LOADER_STAGES = [
  { label: "Reading your products", progress: 15 },
  { label: "Understanding your vibe", progress: 30 },
  { label: "Drafting 9 scenes", progress: 55 },
  { label: "Rendering in 4K", progress: 85 },
  { label: "Curating favorites", progress: 97 },
];

export function MoodboardView({ previewId }: { previewId: string }) {
  const status = trpc.preview.status.useQuery(
    { id: previewId },
    { refetchInterval: (data) => (data && data.state.data?.status === "succeeded" ? false : 3000) },
  );

  const favoriteMutation = trpc.preview.favorite.useMutation({
    onSuccess: () => status.refetch(),
  });

  const images = (status.data?.moodboardImages as MoodboardImage[] | null) ?? [];
  const favorites = status.data?.favorites ?? [];
  const favoriteSet = useMemo(() => new Set(favorites.map((f) => f.imageIndex)), [favorites]);

  const grouped = useMemo(() => {
    const byStyle: Record<string, MoodboardImage[]> = {
      social_style: [],
      editorial_hero: [],
      cgi_concept: [],
    };
    for (const img of images) {
      byStyle[img.stylePreset]?.push(img);
    }
    return byStyle;
  }, [images]);

  if (status.isError) {
    return (
      <div className="max-w-[560px] mx-auto px-6 py-24 md:py-32">
        <MonoLabel>Not found</MonoLabel>
        <h1 className="mt-3 brand-heading">We couldn&rsquo;t find that moodboard</h1>
        <p className="mt-3 text-[15px] fw-340 text-ink/70 leading-[1.5] max-w-[52ch]">
          It may have expired, or the link is incorrect. Start a fresh preview — it takes 60-90 seconds.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/try"><Button variant="black">Start fresh preview</Button></Link>
          <Link href="/gallery"><Button variant="outline">See examples</Button></Link>
        </div>
      </div>
    );
  }

  if (status.isLoading) {
    return (
      <div className="max-w-[560px] mx-auto px-6 py-24 md:py-32">
        <MonoLabel>Loading your moodboard</MonoLabel>
        <div className="mt-6 h-2 w-48 rounded-full bg-ink/10 overflow-hidden">
          <div className="h-full w-1/2 bg-ink/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (status.data?.status === "failed") {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-24">
        <MonoLabel>Preview failed</MonoLabel>
        <h1 className="mt-3 brand-heading">Something went wrong</h1>
        <p className="mt-2 text-[16px] fw-330 text-ink/70 leading-[1.5]">
          {status.data.failureReason ?? "Please try again or browse our examples."}
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/try"><Button variant="black">Try again</Button></Link>
          <Link href="/gallery"><Button variant="outline">See examples</Button></Link>
        </div>
      </div>
    );
  }

  if (status.data?.status !== "succeeded") {
    const stageIndex =
      status.data?.status === "generating" ? 3 : status.data?.status === "intake" ? 1 : 0;
    const activeStage = LOADER_STAGES[stageIndex] ?? LOADER_STAGES[0]!;
    return (
      <div className="max-w-[560px] mx-auto px-6 py-20 md:py-28">
        <MonoLabel>Rendering</MonoLabel>
        <h1 className="mt-3 brand-heading">Cooking your moodboard…</h1>
        <p className="mt-3 text-[15px] fw-340 text-ink/70 leading-[1.5]">
          Usually 60-90 seconds. We&rsquo;re interpreting your references and rendering 9 scenes.
        </p>

        <div className="mt-10">
          <Progress value={activeStage.progress} size="lg" />
        </div>

        <ul className="mt-6 space-y-3">
          {LOADER_STAGES.map((s, i) => {
            const done = i < stageIndex;
            const active = i === stageIndex;
            return (
              <li
                key={s.label}
                className={`flex items-center gap-3 text-[14px] tracking-[-0.14px] ${
                  active ? "text-ink fw-540" : done ? "text-ink/60 fw-340" : "text-ink/30 fw-330"
                }`}
              >
                <span
                  aria-hidden
                  className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] ${
                    done
                      ? "bg-ink text-paper"
                      : active
                        ? "border-2 border-ink text-ink"
                        : "border border-ink/20 text-ink/30"
                  }`}
                >
                  {done ? "✓" : active ? "●" : ""}
                </span>
                {s.label}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 md:py-16">
      <div className="flex items-end justify-between gap-8 flex-wrap mb-10">
        <div>
          <MonoLabel>Your moodboard</MonoLabel>
          <h1 className="mt-3 brand-heading">9 directions · tap to favorite</h1>
          <p className="mt-3 text-[15px] fw-340 text-ink/70 leading-[1.5] max-w-[52ch]">
            Favorites seed your first week of content after signup.
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {(["social_style", "editorial_hero", "cgi_concept"] as const).map((style) => {
          const row = grouped[style] ?? [];
          const meta = STYLE_LABELS[style]!;
          const videoUrl = row.find((img) => img.videoUrl)?.videoUrl;
          return (
            <div key={style}>
              <div className="mb-4 flex items-center gap-3">
                <MonoLabel>{meta.title}</MonoLabel>
                <Badge tone="outline" size="sm">{meta.tag}</Badge>
                <div className="h-px bg-ink/10 flex-1" />
              </div>

              {/* Video reel */}
              {videoUrl && (
                <div className="mb-4 rounded-[12px] overflow-hidden border border-ink/10 bg-ink/4">
                  <video
                    src={videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full max-h-[340px] object-cover"
                  />
                  <div className="px-4 py-2 flex items-center gap-2">
                    <span className="text-[11px] fw-430 tracking-[0.3px] uppercase text-ink/40">
                      Video reel
                    </span>
                    <span className="text-[11px] text-ink/30">·</span>
                    <span className="text-[11px] fw-330 text-ink/40">
                      Assembled from your 3 scenes
                    </span>
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3">
                {row.map((img) => {
                  const faved = favoriteSet.has(img.index);
                  return (
                    <button
                      key={img.index}
                      type="button"
                      onClick={() =>
                        favoriteMutation.mutate({
                          previewId,
                          imageIndex: img.index,
                          stylePreset: img.stylePreset,
                          sceneId: img.sceneId,
                        })
                      }
                      className="group relative aspect-[4/5] rounded-[12px] overflow-hidden border border-ink/10 hover:border-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-2 focus-visible:outline-ink transition-colors"
                    >
                      <Image
                        src={img.url}
                        alt={img.sceneHeadline}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div
                        className={`absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center text-[16px] transition-colors ${
                          faved
                            ? "bg-ink text-paper"
                            : "bg-paper/90 text-ink backdrop-blur group-hover:bg-paper"
                        }`}
                      >
                        {faved ? "★" : "☆"}
                      </div>
                      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                        <span className="text-[13px] fw-480 tracking-[-0.14px] text-paper">
                          {img.sceneHeadline}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div>
          <div className="mb-4 flex items-center gap-3">
            <MonoLabel className="text-ink/40">Fashion Campaign</MonoLabel>
            <Badge tone="neutral" size="sm" dot>Premium</Badge>
            <div className="h-px bg-ink/10 flex-1" />
          </div>
          <Card variant="bordered" className="flex items-center justify-between gap-6 flex-wrap">
            <div className="max-w-[48ch]">
              <div className="text-[18px] fw-540 tracking-[-0.2px] text-ink">
                Editorial lookbook + model consistency
              </div>
              <p className="mt-2 text-[14px] fw-340 leading-[1.5] text-ink/70">
                Unlock Fashion Campaign with a consistent brand face across every shot. Available in Premium.
              </p>
            </div>
            <Link href="/pricing"><Button variant="outline">See Premium</Button></Link>
          </Card>
        </div>
      </div>

      <Card variant="elevated" className="mt-12 p-7 md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <MonoLabel size="sm" className="text-ink/55 block mb-2">
                {favorites.length > 0 ? `You favorited ${favorites.length}` : "Pick what you love"}
              </MonoLabel>
              <p className="text-[18px] fw-540 tracking-[-0.2px] leading-[1.3]">
                {favorites.length > 0
                  ? "Save your picks and get started."
                  : "Favorite scenes to seed your first week."}
              </p>
            </div>
          </div>

          <Link href={`/sign-in?redirect=/try/moodboard/${previewId}`} className="w-full">
            <Button variant="black" fullWidth>
              Sign in to save your moodboard
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-ink/10" />
            <span className="text-[12px] fw-330 text-ink/40">or go straight to checkout</span>
            <div className="h-px flex-1 bg-ink/10" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/checkout?plan=week_pass&preview=${previewId}`} className="flex-1">
              <Button variant="outline" fullWidth>Try 1 week - $49</Button>
            </Link>
            <Link href={`/checkout?plan=base&preview=${previewId}`} className="flex-1">
              <Button variant="outline" fullWidth>Start - $250 / mo</Button>
            </Link>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-ink/6 flex flex-wrap gap-x-6 gap-y-2 text-[12px] fw-340 tracking-[-0.14px] text-ink/55">
          <span>✓ Cancel anytime</span>
          <span>✓ First week refundable</span>
          <span>✓ Watermark removed after checkout</span>
        </div>
      </Card>
    </div>
  );
}
