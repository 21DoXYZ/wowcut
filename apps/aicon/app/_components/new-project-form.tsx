"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

const DURATION_OPTIONS = [
  { value: "s15", label: "15s", desc: "4 scenes · Reels hook" },
  { value: "s30", label: "30s", desc: "6 scenes · Standard reel" },
  { value: "s60", label: "60s", desc: "8 scenes · Long-form short" },
] as const;

const EXAMPLES = [
  "Abandoned BMW restoration timelapse",
  "Dog grooming transformation at pet salon",
  "Apartment renovation before and after",
  "Handmade ceramic bowl from clay to glaze",
  "Sourdough bread from starter to fresh loaf",
];

export function NewProjectForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState<"s15" | "s30" | "s60">("s30");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [showReference, setShowReference] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = trpc.project.create.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const project = await create.mutateAsync({
        topic: topic.trim(),
        duration,
        referenceUrl: referenceUrl.trim() || undefined,
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Topic input */}
      <div className="relative">
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Dog grooming transformation at a pet salon"
          rows={2}
          maxLength={200}
          className="w-full bg-white/6 border border-white/12 rounded-xl px-5 py-4 text-[16px] text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-indigo-500/70 transition-colors"
        />
        <span className="absolute bottom-3 right-4 text-[11px] text-white/20 font-mono">
          {topic.length}/200
        </span>
      </div>

      {/* Example chips */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setTopic(ex)}
            className="text-[12px] text-white/40 border border-white/10 rounded-full px-3 py-1 hover:border-white/30 hover:text-white/70 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Duration */}
      <div className="flex gap-3">
        {DURATION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDuration(opt.value)}
            className={[
              "flex-1 rounded-xl border px-4 py-3 text-left transition-all",
              duration === opt.value
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-white/10 hover:border-white/25",
            ].join(" ")}
          >
            <div className="text-[20px] font-bold tracking-[-0.5px]">{opt.label}</div>
            <div className="text-[11px] text-white/40 mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* Reference URL (optional) */}
      <div>
        {!showReference ? (
          <button
            type="button"
            onClick={() => setShowReference(true)}
            className="text-[12px] text-white/40 hover:text-white/70 transition-colors"
          >
            + Add reference video (Instagram / TikTok / YouTube)
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] text-white/50 font-mono uppercase tracking-[0.6px]">
                Reference URL
              </label>
              <button
                type="button"
                onClick={() => { setShowReference(false); setReferenceUrl(""); }}
                className="text-[11px] text-white/30 hover:text-white/60"
              >
                remove
              </button>
            </div>
            <input
              type="url"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/... or tiktok.com/... or youtu.be/..."
              className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/70 transition-colors"
            />
            <p className="text-[11px] text-white/30">
              We&rsquo;ll watch the clip and mimic its pacing, mood and cut style for your topic.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[13px] text-red-400 bg-red-400/8 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!topic.trim() || loading}
        className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold text-[15px] rounded-xl py-4 transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating project…
          </span>
        ) : (
          "Generate video →"
        )}
      </button>
    </form>
  );
}
