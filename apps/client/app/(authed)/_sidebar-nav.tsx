"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@wowcut/ui/cn";
import { PLAN_LIMITS } from "@wowcut/shared";

type PlanId = keyof typeof PLAN_LIMITS;

interface NavItem {
  href: string;
  label: string;
  planKey?: keyof (typeof PLAN_LIMITS)[PlanId];
}

const NAV: NavItem[] = [
  { href: "/deliveries", label: "Deliveries" },
  { href: "/library", label: "Library" },
  { href: "/calendar", label: "Calendar", planKey: "calendarEnabled" },
  { href: "/insights", label: "Insights", planKey: "insightsEnabled" },
  { href: "/support", label: "Support", planKey: "supportEnabled" },
  { href: "/brief", label: "Brief" },
  { href: "/settings", label: "Settings" },
];

export function SidebarNav({ plan }: { plan?: string }) {
  const pathname = usePathname();

  function isEnabled(item: NavItem): boolean {
    if (!item.planKey) return true;
    const limits = PLAN_LIMITS[plan as PlanId];
    if (!limits) return true;
    return !!(limits[item.planKey as keyof typeof limits]);
  }

  return (
    <nav className="flex-1 px-3 py-5 space-y-0.5">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const enabled = isEnabled(item);

        if (!enabled) {
          return (
            <Link
              key={item.href}
              href="/pricing"
              title="Upgrade to access"
              className={cn(
                "flex items-center justify-between h-10 px-4 rounded-pill text-[14px] fw-440 tracking-[-0.14px]",
                "text-ink/30 hover:text-ink/50 transition-colors",
              )}
            >
              <span>{item.label}</span>
              <span className="text-[10px] fw-540 uppercase tracking-[0.4px] bg-ink/8 text-ink/40 px-1.5 py-0.5 rounded-[4px]">
                Plus
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center h-10 px-4 rounded-pill text-[14px] fw-440 tracking-[-0.14px]",
              "transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-2 focus-visible:outline-ink",
              active
                ? "bg-ink text-paper shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                : "text-ink/70 hover:text-ink hover:bg-ink/5",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
