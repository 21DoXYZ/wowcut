"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Card, MonoLabel, Badge } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

interface MoodboardImage {
  index: number;
  stylePreset: string;
  url: string;
  sceneHeadline: string;
}

export function ConfirmOnboardingView() {
  const router = useRouter();
  const [tone, setTone] = useState<"minimal" | "bold" | "playful">("minimal");
  const [channels, setChannels] = useState<string[]>(["instagram"]);
  const onboarding = trpc.onboarding.status.useQuery();
  const confirm = trpc.onboarding.confirm.useMutation({
    onSuccess: () => router.push("/deliveries"),
  });

  if (onboarding.isLoading) {
    return <div className="text-ink/60 fw-330">Loading…</div>;
  }

  const summary = onboarding.data?.previewSummary;
  const moodboard = (summary?.moodboardImages ?? []) as MoodboardImage[];
  const favoriteIndexes = new Set(summary?.favorites.map((f) => f.imageIndex) ?? []);
  const favoriteImages = moodboard.filter((m) => favoriteIndexes.has(m.index));
  const favoriteStyles = Array.from(new Set(summary?.favorites.map((f) => f.stylePreset) ?? []));

  function toggleChannel(id: string) {
    setChannels((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <MonoLabel size="sm" className="text-ink/60">Brand</MonoLabel>
            <h3 className="mt-1 fw-540 text-[22px] tracking-[-0.4px]">
              {onboarding.data?.brandName ?? "Your brand"}
            </h3>
          </div>
          <div className="flex gap-2">
            <Badge tone="neutral">{onboarding.data?.plan ?? "base"}</Badge>
            <Badge tone="neutral">{onboarding.data?.status ?? "—"}</Badge>
          </div>
        </div>
      </Card>

      {favoriteImages.length > 0 && (
        <Card className="p-6">
          <MonoLabel size="sm" className="text-ink/60">Your favorites ({favoriteImages.length})</MonoLabel>
          <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-3">
            {favoriteImages.map((img) => (
              <div
                key={img.index}
                className="aspect-square rounded-lg overflow-hidden border border-ink/10 relative"
              >
                <Image src={img.url} alt={img.sceneHeadline} fill className="object-cover" />
              </div>
            ))}
          </div>
          <p className="mt-4 text-body fw-330 text-ink/60">
            Week 1 will use these scenes as the starting point.
          </p>
        </Card>
      )}

      <Card className="p-6">
        <MonoLabel size="sm" className="text-ink/60">Styles picked</MonoLabel>
        <div className="mt-3 flex gap-2 flex-wrap">
          {(favoriteStyles.length > 0 ? favoriteStyles : ["editorial_hero", "social_style"]).map((s) => (
            <Badge key={s} tone="ink">{s.replace(/_/g, " ")}</Badge>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div>
          <MonoLabel size="sm" className="text-ink/60">Tone of voice</MonoLabel>
          <div className="mt-3 flex gap-2 flex-wrap">
            {(["minimal", "bold", "playful"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`brand-pill-tab border ${
                  tone === t ? "bg-ink text-paper border-ink" : "bg-paper text-ink border-ink/15"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <MonoLabel size="sm" className="text-ink/60">Where you post</MonoLabel>
          <div className="mt-3 flex gap-2 flex-wrap">
            {[
              { id: "instagram", label: "Instagram" },
              { id: "tiktok", label: "TikTok" },
              { id: "pinterest", label: "Pinterest" },
              { id: "website", label: "Website" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleChannel(c.id)}
                className={`brand-pill-tab border ${
                  channels.includes(c.id)
                    ? "bg-ink text-paper border-ink"
                    : "bg-paper text-ink border-ink/15"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Button
        variant="black"
        className="w-full md:w-auto px-8 py-4 text-[18px]"
        disabled={confirm.isPending}
        onClick={() =>
          confirm.mutate({
            toneOfVoice: tone,
            channels: channels as ("instagram" | "tiktok" | "pinterest" | "website")[],
          })
        }
      >
        {confirm.isPending ? "Starting production…" : "Confirm & start production"}
      </Button>
    </div>
  );
}
