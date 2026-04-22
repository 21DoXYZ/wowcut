import type { HTMLAttributes } from "react";
import { cn } from "../cn";

type Size = "xs" | "sm" | "md";

export interface MonoLabelProps extends HTMLAttributes<HTMLSpanElement> {
  size?: Size;
}

const SIZE: Record<Size, string> = {
  xs: "text-[10px] tracking-[0.72px]",
  sm: "text-[11px] tracking-[0.6px]",
  md: "text-[13px] tracking-[0.56px]",
};

export function MonoLabel({ size = "md", className, children, ...rest }: MonoLabelProps) {
  return (
    <span
      className={cn(
        "inline-block font-mono font-[440] uppercase leading-none",
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
