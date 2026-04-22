import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "../cn";

const FIELD_BASE =
  "w-full bg-paper text-ink placeholder:text-ink/35 " +
  "text-[15px] leading-[1.45] tracking-[-0.14px] font-[340] " +
  "border border-ink/15 rounded-lg " +
  "transition-[border-color,box-shadow] duration-150 ease-out " +
  "hover:border-ink/35 " +
  "focus:outline-none focus:border-ink focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cn(FIELD_BASE, "h-11 px-4", className)} {...rest} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(FIELD_BASE, "min-h-[110px] px-4 py-3 resize-y", className)}
      {...rest}
    />
  ),
);
Textarea.displayName = "Textarea";

export function Label({
  htmlFor,
  children,
  hint,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex items-baseline justify-between gap-3", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[13px] leading-none font-[480] tracking-[-0.14px] text-ink"
      >
        {children}
      </label>
      {hint ? (
        <span className="text-[12px] leading-none font-[340] tracking-[-0.14px] text-ink/50">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 text-[12px] leading-[1.35] font-[400] tracking-[-0.14px] text-[#9B1B1B]">
      {children}
    </p>
  );
}
