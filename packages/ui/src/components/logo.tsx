import type { HTMLAttributes } from "react";
import { cn } from "../cn";

type Size = "sm" | "md" | "lg";

export interface LogoProps extends HTMLAttributes<HTMLSpanElement> {
  size?: Size;
  tone?: "ink" | "paper";
}

const SIZE: Record<Size, string> = {
  sm: "text-[16px] tracking-[-0.8px]",
  md: "text-[20px] tracking-[-1px]",
  lg: "text-[28px] tracking-[-1.4px]",
};

export function Logo({ size = "md", tone = "ink", className, ...rest }: LogoProps) {
  return (
    <span
      aria-label="Wowcut"
      className={cn(
        "inline-flex items-center leading-none font-[540] whitespace-nowrap",
        SIZE[size],
        tone === "ink" ? "text-ink" : "text-paper",
        className,
      )}
      {...rest}
    >
      WOWCUT
    </span>
  );
}
