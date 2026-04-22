import type { HTMLAttributes } from "react";
import { cn } from "../cn";

type Tone = "neutral" | "ink" | "trend" | "warn" | "ok" | "outline" | "premium";
type Size = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: Size;
  dot?: boolean;
}

const TONE: Record<Tone, string> = {
  neutral: "bg-ink/6 text-ink border border-transparent",
  ink: "bg-ink text-paper border border-transparent",
  outline: "bg-paper text-ink border border-ink/25",
  trend:
    "bg-[linear-gradient(90deg,#86FF6B_0%,#FFE24B_35%,#FF4BD4_70%,#7A3BFF_100%)] " +
    "text-ink border border-transparent shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]",
  premium: "bg-ink text-paper border border-transparent",
  warn: "bg-[#FFE24B] text-ink border border-transparent",
  ok: "bg-[#86FF6B] text-ink border border-transparent",
};

const SIZE: Record<Size, string> = {
  sm: "h-[20px] px-2 text-[10px] tracking-[0.6px]",
  md: "h-[24px] px-2.5 text-[11px] tracking-[0.6px]",
};

const DOT_TONE: Record<Tone, string> = {
  neutral: "bg-ink/50",
  ink: "bg-paper",
  outline: "bg-ink",
  trend: "bg-ink",
  premium: "bg-paper",
  warn: "bg-ink",
  ok: "bg-ink",
};

export function Badge({
  tone = "neutral",
  size = "md",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-mono uppercase font-[480] leading-none",
        TONE[tone],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", DOT_TONE[tone])} /> : null}
      {children}
    </span>
  );
}
