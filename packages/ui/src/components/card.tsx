import type { HTMLAttributes } from "react";
import { cn } from "../cn";

type Variant = "flat" | "bordered" | "elevated" | "emphasis";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  noPadding?: boolean;
}

const VARIANT: Record<Variant, string> = {
  flat: "bg-paper",
  bordered: "bg-paper border border-ink/10",
  elevated:
    "bg-paper border border-ink/8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]",
  emphasis:
    "bg-paper border-2 border-ink shadow-[0_2px_4px_rgba(0,0,0,0.06),0_16px_48px_rgba(0,0,0,0.1)]",
};

export function Card({ variant = "bordered", noPadding = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[12px]",
        VARIANT[variant],
        !noPadding && "p-6",
        className,
      )}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[22px] leading-[1.2] font-[540] tracking-[-0.4px] text-ink",
        className,
      )}
      {...rest}
    />
  );
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[15px] leading-[1.5] font-[330] tracking-[-0.14px] text-ink/70 mt-2",
        className,
      )}
      {...rest}
    />
  );
}

export function CardEyebrow({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "font-mono uppercase text-[11px] tracking-[0.6px] text-ink/55 mb-3",
        className,
      )}
      {...rest}
    />
  );
}
