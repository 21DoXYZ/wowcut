"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@wowcut/ui/cn";
import { MonoLabel } from "@wowcut/ui/components";

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    heading: "Workspace",
    items: [
      { href: "/", label: "Dashboard" },
      { href: "/clients", label: "Clients" },
      { href: "/plan", label: "Plan" },
      { href: "/deliveries", label: "Deliveries" },
      { href: "/library", label: "Library" },
    ],
  },
  {
    heading: "Queues",
    items: [
      { href: "/queue/generation", label: "Generation" },
      { href: "/queue/qc", label: "QC" },
      { href: "/queue/confidence", label: "Confidence" },
      { href: "/queue/assembly", label: "Assembly" },
    ],
  },
  {
    heading: "Admin",
    items: [
      { href: "/trends", label: "Trends" },
      { href: "/qc-profiles", label: "QC profiles" },
      { href: "/metrics", label: "Metrics" },
    ],
  },
];

export function OperatorSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
      {GROUPS.map((group) => (
        <div key={group.heading}>
          <MonoLabel size="xs" className="px-4 text-ink/40 block mb-1.5">
            {group.heading}
          </MonoLabel>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center h-9 px-4 rounded-pill text-[13px] fw-440 tracking-[-0.14px]",
                    "transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-2 focus-visible:outline-ink",
                    active
                      ? "bg-ink text-paper shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
                      : "text-ink/70 hover:text-ink hover:bg-ink/5",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
