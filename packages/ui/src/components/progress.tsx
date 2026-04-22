import { cn } from "../cn";

export interface ProgressProps {
  value: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  indeterminate?: boolean;
}

const SIZE = {
  sm: "h-[3px]",
  md: "h-[5px]",
  lg: "h-[8px]",
};

export function Progress({ value, className, size = "md", indeterminate }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full rounded-full bg-ink/10 overflow-hidden relative",
        SIZE[size],
        className,
      )}
    >
      {indeterminate ? (
        <div
          className="absolute inset-y-0 w-1/3 rounded-full bg-ink"
          style={{
            animation: "wowcut-progress-indeterminate 1.4s ease-in-out infinite",
          }}
        />
      ) : (
        <div
          className="h-full bg-ink transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      )}
      <style>{`
        @keyframes wowcut-progress-indeterminate {
          0% { left: -33%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

export function Stepper({
  current,
  total,
  className,
}: {
  current: number;
  total: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1.5", className)} aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "flex-1 h-[5px] rounded-full transition-colors duration-300",
            i < current ? "bg-ink" : "bg-ink/12",
          )}
        />
      ))}
    </div>
  );
}
