"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@wowcut/ui/cn";

const NAV = [
  { href: "/deliveries", label: "Deliveries" },
  { href: "/library", label: "Library" },
  { href: "/calendar", label: "Calendar" },
  { href: "/insights", label: "Insights" },
  { href: "/support", label: "Support" },
  { href: "/brief", label: "Brief" },
  { href: "/settings", label: "Settings" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-5 space-y-0.5">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
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
