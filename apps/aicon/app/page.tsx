import Link from "next/link";
import { NewProjectForm } from "./_components/new-project-form";
import { ProjectList } from "./_components/project-list";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[18px] font-semibold tracking-[-0.4px]">aicon</span>
          <span className="text-[11px] font-mono text-white/30 bg-white/6 px-2 py-0.5 rounded-full">
            content farm
          </span>
        </div>
      </header>

      <main className="max-w-[960px] mx-auto px-6 py-12">
        {/* New project */}
        <section className="mb-16">
          <h1 className="text-[32px] md:text-[48px] font-bold tracking-[-1px] leading-[1.1] mb-3">
            What&rsquo;s the video about?
          </h1>
          <p className="text-[16px] text-white/50 mb-8 leading-relaxed max-w-[52ch]">
            Give me a topic — I&apos;ll write the script, generate the storyboard,
            render images and animate every scene.
          </p>
          <NewProjectForm />
        </section>

        {/* Project list */}
        <section>
          <h2 className="text-[13px] font-mono text-white/30 uppercase tracking-[0.6px] mb-5">
            Recent projects
          </h2>
          <ProjectList />
        </section>
      </main>
    </div>
  );
}
