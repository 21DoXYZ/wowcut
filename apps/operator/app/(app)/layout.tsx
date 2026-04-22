import { UserButton } from "@clerk/nextjs";
import { Logo, MonoLabel } from "@wowcut/ui/components";
import { OperatorSidebarNav } from "./_sidebar-nav";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper flex">
      <aside className="w-[240px] shrink-0 border-r border-ink/6 flex flex-col bg-paper sticky top-0 h-screen">
        <div className="px-6 py-5 border-b border-ink/6">
          <Logo />
          <MonoLabel size="sm" className="mt-2 text-ink/45 block">
            Operator OS
          </MonoLabel>
        </div>
        <OperatorSidebarNav />
        <div className="px-5 py-4 border-t border-ink/6 flex items-center justify-between">
          <MonoLabel size="sm" className="text-ink/45">Account</MonoLabel>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
