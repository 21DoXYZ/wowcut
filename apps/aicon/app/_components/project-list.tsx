"use client";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

const STATUS_COLORS: Record<string, string> = {
  draft:      "bg-white/10 text-white/40",
  scripted:   "bg-blue-500/15 text-blue-400",
  generating: "bg-amber-500/15 text-amber-400",
  reviewing:  "bg-indigo-500/15 text-indigo-400",
  animating:  "bg-purple-500/15 text-purple-400",
  assembling: "bg-pink-500/15 text-pink-400",
  done:       "bg-emerald-500/15 text-emerald-400",
  failed:     "bg-red-500/15 text-red-400",
};

const DURATION_LABEL: Record<string, string> = {
  s15: "15s", s30: "30s", s60: "60s",
};

export function ProjectList() {
  const { data: projects, isLoading } = trpc.project.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-white/4 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <p className="text-[14px] text-white/25 py-6">
        No projects yet — create your first video above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => {
        const doneImages = project.scenes.filter((s) => s.imageStatus === "done").length;
        const totalScenes = project.scenes.length;
        const doneVideos = project.scenes.filter((s) => s.videoStatus === "done").length;

        return (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="flex items-center justify-between gap-4 bg-white/4 hover:bg-white/7 border border-white/6 hover:border-white/12 rounded-xl px-5 py-4 transition-all group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-white truncate">{project.topic}</p>
              <p className="text-[12px] text-white/30 mt-0.5">
                {DURATION_LABEL[project.duration]} · {totalScenes} scenes
                {doneImages > 0 && ` · ${doneImages}/${totalScenes} images`}
                {doneVideos > 0 && ` · ${doneVideos} animated`}
              </p>
            </div>
            <span className={`shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-full ${STATUS_COLORS[project.status] ?? "bg-white/10 text-white/40"}`}>
              {project.status}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
