import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../cn";

type Variant = "black" | "white" | "outline" | "ghost" | "glassDark" | "glassLight";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none " +
  "transition-[transform,opacity,background-color,border-color,box-shadow] duration-150 ease-out " +
  "tracking-[-0.14px] font-[480] leading-none " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-2 focus-visible:outline-ink " +
  "disabled:opacity-40 disabled:pointer-events-none " +
  "active:scale-[0.98]";

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-[14px] rounded-pill",
  md: "h-11 px-5 text-[15px] rounded-pill",
  lg: "h-14 px-7 text-[17px] rounded-pill",
};

const ICON_SIZE: Record<Size, string> = {
  sm: "h-9 w-9 rounded-full p-0",
  md: "h-11 w-11 rounded-full p-0",
  lg: "h-14 w-14 rounded-full p-0",
};

const VARIANT: Record<Variant, string> = {
  black:
    "bg-ink text-paper border border-ink hover:bg-ink/90 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:bg-ink",
  white:
    "bg-paper text-ink border border-ink/15 hover:border-ink hover:-translate-y-px " +
    "active:translate-y-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
  outline:
    "bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper",
  ghost:
    "bg-transparent text-ink border border-transparent hover:bg-ink/5",
  glassDark:
    "bg-[rgba(0,0,0,0.08)] text-ink border border-[rgba(0,0,0,0.06)] backdrop-blur-sm " +
    "hover:bg-[rgba(0,0,0,0.12)]",
  glassLight:
    "bg-[rgba(255,255,255,0.22)] text-paper border border-[rgba(255,255,255,0.35)] " +
    "backdrop-blur-md hover:bg-[rgba(255,255,255,0.32)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "black",
      size = "md",
      iconOnly = false,
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          BASE,
          iconOnly ? ICON_SIZE[size] : SIZE[size],
          VARIANT[variant],
          fullWidth && !iconOnly && "w-full",
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span
            aria-hidden
            className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          />
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = "Button";
