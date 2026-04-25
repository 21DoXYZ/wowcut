"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-white/8 text-white/40",
  generating: "bg-amber-500/15 text-amber-400",
  done:       "bg-emerald-500/15 text-emerald-400",
  failed:     "bg-red-500/15 text-red-400",
};

const SHOT_ICONS: Record<string, string> = {
  close_up: "🔍", wide: "🌅", medium: "📷",
  overhead: "⬇️", pov: "👁️", tracking: "🎬",
};

interface FeedbackModalProps {
  sceneId: string;
  onClose: () => void;
  onSubmit: (sceneId: string, feedback: string) => void;
}

function FeedbackModal({ sceneId, onClose, onSubmit }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState("");
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-[#111] border border-white/12 rounded-2xl p-6 w-full max-w-[420px]">
        <h3 className="text-[16px] font-semibold mb-3">What should be different?</h3>
        <textarea
          autoFocus
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="e.g. More dramatic lighting, show the rust on the car door..."
          rows={3}
          className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-indigo-500/60 transition-colors"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border border-white/12 text-white/60 text-[13px] rounded-xl py-2.5 hover:border-white/25 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (feedback.trim()) { onSubmit(sceneId, feedback.trim()); onClose(); } }}
            disabled={!feedback.trim()}
            className="flex-1 bg-indigo-500 disabled:bg-white/10 text-white text-[13px] font-medium rounded-xl py-2.5 transition-colors"
          >
            Regenerate scene
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProjectView({ projectId }: { projectId: string }) {
  const [feedbackSceneId, setFeedbackSceneId] = useState<string | null>(null);

  const { data: project, refetch } = trpc.project.get.useQuery(
    { id: projectId },
    { refetchInterval: (data) => {
        const status = data?.state?.data?.status;
        return status === "reviewing" || status === "done" || status === "failed" ? false : 4000;
      },
    },
  );

  const reviewScene = trpc.project.reviewScene.useMutation({
    onSuccess: () => refetch(),
  });
  const startAnimation = trpc.project.startAnimation.useMutation({
    onSuccess: () => refetch(),
  });

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const scenes = project.scenes ?? [];
  const allImagesReady = scenes.every((s) => s.imageStatus === "done" || s.imageStatus === "failed");
  const approvedCount = scenes.filter((s) => s.approved).length;
  const animatedCount = scenes.filter((s) => s.videoStatus === "done").length;
  const canAnimate = approvedCount > 0 && project.status === "reviewing";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/8 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/40 hover:text-white text-[13px] transition-colors">← Back</Link>
        <span className="text-white/20">|</span>
        <span className="text-[14px] font-medium text-white/80 truncate">{project.topic}</span>
        <span className="ml-auto text-[11px] font-mono text-white/30 bg-white/6 px-2.5 py-1 rounded-full">
          {project.status}
        </span>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-10">
        {/* Script overview */}
        {project.script && (
          <div className="mb-10 p-5 bg-white/4 border border-white/8 rounded-xl">
            <p className="text-[11px] font-mono text-white/30 uppercase tracking-[0.6px] mb-2">Hook</p>
            <p className="text-[15px] text-white/80 italic">
              &ldquo;{(project.script as { hook: string }).hook}&rdquo;
            </p>
          </div>
        )}

        {/* Progress bar */}
        {!allImagesReady && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-white/40">Generating images…</span>
              <span className="text-[12px] font-mono text-white/40">
                {scenes.filter((s) => s.imageStatus === "done").length}/{scenes.length}
              </span>
            </div>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${(scenes.filter((s) => s.imageStatus === "done").length / Math.max(scenes.length, 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Storyboard grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {scenes.map((scene) => {
            const isApproved = scene.approved;
            const hasImage = scene.imageStatus === "done" && scene.imageUrl;
            const isGenerating = scene.imageStatus === "generating";
            const isAnimated = scene.videoStatus === "done";

            return (
              <div
                key={scene.id}
                className={[
                  "rounded-xl border overflow-hidden transition-all",
                  isApproved ? "border-emerald-500/40" : "border-white/8",
                ].join(" ")}
              >
                {/* Image frame */}
                <div className="relative aspect-[9/16] bg-white/4">
                  {hasImage && scene.imageUrl ? (
                    <Image
                      src={scene.imageUrl}
                      alt={scene.title}
                      fill
                      className="object-cover"
                    />
                  ) : isGenerating ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/15 text-[12px]">
                      pending
                    </div>
                  )}

                  {/* Scene index */}
                  <div className="absolute top-2 left-2 h-6 w-6 bg-black/60 rounded-full flex items-center justify-center text-[11px] font-mono text-white/70">
                    {scene.index + 1}
                  </div>

                  {/* Shot type */}
                  {scene.shotType && (
                    <div className="absolute top-2 right-2 text-[14px]">
                      {SHOT_ICONS[scene.shotType] ?? "📷"}
                    </div>
                  )}

                  {/* Animated badge */}
                  {isAnimated && (
                    <div className="absolute bottom-2 left-2 text-[10px] font-mono bg-purple-500/80 text-white px-2 py-0.5 rounded-full">
                      animated
                    </div>
                  )}
                </div>

                {/* Scene info */}
                <div className="p-3 bg-[#111]">
                  <p className="text-[13px] font-medium text-white leading-tight mb-1">{scene.title}</p>
                  <p className="text-[11px] text-white/40 leading-snug line-clamp-2">{scene.action}</p>
                  {scene.voiceover && (
                    <p className="text-[11px] text-indigo-400/70 mt-1 italic">
                      &ldquo;{scene.voiceover}&rdquo;
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-white/20 mt-1">{scene.durationS}s</p>

                  {/* Approval buttons */}
                  {hasImage && !isApproved && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => reviewScene.mutate({ sceneId: scene.id, approved: true })}
                        className="flex-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[12px] rounded-lg py-1.5 transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => setFeedbackSceneId(scene.id)}
                        className="flex-1 bg-white/6 hover:bg-white/10 text-white/50 text-[12px] rounded-lg py-1.5 transition-colors"
                      >
                        ↻ Redo
                      </button>
                    </div>
                  )}

                  {isApproved && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400">
                      <span>✓</span>
                      <span>Approved</span>
                      <button
                        onClick={() => reviewScene.mutate({ sceneId: scene.id, approved: false })}
                        className="ml-auto text-white/25 hover:text-white/50 transition-colors"
                      >
                        undo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {allImagesReady && (
          <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[15px] font-medium">
                {approvedCount} of {scenes.length} scenes approved
              </p>
              <p className="text-[13px] text-white/40 mt-0.5">
                {canAnimate
                  ? "Ready to animate approved scenes with Veo"
                  : "Approve scenes to start animation"}
              </p>
            </div>
            <button
              onClick={() => startAnimation.mutate({ projectId })}
              disabled={!canAnimate || startAnimation.isPending}
              className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold text-[14px] rounded-xl px-6 py-3 transition-colors"
            >
              {startAnimation.isPending ? "Starting…" : `Animate ${approvedCount} scenes →`}
            </button>
          </div>
        )}

        {/* Final video */}
        {project.finalVideoUrl && (
          <div className="mt-10">
            <h2 className="text-[13px] font-mono text-white/30 uppercase tracking-[0.6px] mb-4">Final video</h2>
            <video
              src={project.finalVideoUrl}
              controls
              className="w-full max-w-[400px] rounded-xl border border-white/10"
            />
          </div>
        )}
      </main>

      {/* Feedback modal */}
      {feedbackSceneId && (
        <FeedbackModal
          sceneId={feedbackSceneId}
          onClose={() => setFeedbackSceneId(null)}
          onSubmit={(id, feedback) => {
            reviewScene.mutate({ sceneId: id, approved: false, feedback });
          }}
        />
      )}
    </div>
  );
}
