import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Logo, MonoLabel } from "@wowcut/ui/components";
import { getCurrentClient } from "@/lib/session";
import { SidebarNav } from "./_sidebar-nav";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentClient();
  if (!current) redirect("/sign-in");

  // Users who haven't confirmed onboarding yet must do so before accessing any other page.
  const pathname = headers().get("x-pathname") ?? "";
  const isOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  if (current.status === "onboarding_confirm" && !isOnboarding) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      <aside className="w-[260px] shrink-0 border-r border-ink/6 flex flex-col bg-paper sticky top-0 h-screen">
        <div className="px-6 py-7 border-b border-ink/6">
          <Logo />
          <div className="mt-3">
            <MonoLabel size="sm" className="text-ink/45 block mb-1">Brand</MonoLabel>
            <div className="text-[15px] fw-540 tracking-[-0.2px] text-ink truncate">
              {current.brandName}
            </div>
          </div>
        </div>
        <SidebarNav plan={current.plan} />
        <div className="p-5 border-t border-ink/6">
          <MonoLabel size="sm" className="text-ink/40 block mb-1">Signed in</MonoLabel>
          <div className="text-[13px] fw-340 tracking-[-0.14px] text-ink/65 truncate">
            {current.email}
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
