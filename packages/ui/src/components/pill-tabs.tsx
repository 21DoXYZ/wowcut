"use client";
import { cn } from "../cn";

export interface PillTab {
  id: string;
  label: string;
  count?: number;
}

export interface PillTabsProps {
  tabs: PillTab[];
  value: string;
  onChange: (id: string) => void;
  variant?: "light" | "dark";
  size?: "sm" | "md";
  fullWidth?: boolean;
}

const SIZE = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-10 px-5 text-[14px]",
};

export function PillTabs({
  tabs,
  value,
  onChange,
  variant = "light",
  size = "md",
  fullWidth = false,
}: PillTabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex gap-0.5 p-1 rounded-pill",
        variant === "light" ? "bg-ink/6" : "bg-paper/15",
        fullWidth && "w-full",
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-pill whitespace-nowrap",
              "leading-none font-[480] tracking-[-0.14px] select-none",
              "transition-[background-color,color,box-shadow] duration-150 ease-out",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-2 focus-visible:outline-ink",
              SIZE[size],
              fullWidth && "flex-1",
              active
                ? variant === "light"
                  ? "bg-ink text-paper shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
                  : "bg-paper text-ink shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
                : variant === "light"
                  ? "text-ink/70 hover:text-ink hover:bg-ink/8"
                  : "text-paper/70 hover:text-paper hover:bg-paper/25",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full text-[10px] font-[500]",
                  active
                    ? variant === "light"
                      ? "bg-paper/20 text-paper"
                      : "bg-ink/15 text-ink"
                    : "bg-ink/10 text-ink/70",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
