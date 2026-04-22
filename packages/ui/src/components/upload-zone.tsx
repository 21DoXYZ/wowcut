"use client";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { cn } from "../cn";

export interface UploadZoneProps {
  label: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  className?: string;
}

const SIZE = {
  sm: "h-[140px]",
  md: "h-[180px]",
  lg: "h-[240px]",
};

const DEFAULT_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden
  >
    <path d="M12 4v12" />
    <path d="M6 10l6-6 6 6" />
    <path d="M4 20h16" />
  </svg>
);

export function UploadZone({
  label,
  hint,
  accept = "image/jpeg,image/png,image/webp",
  multiple = false,
  disabled = false,
  onFiles,
  size = "md",
  icon,
  className,
}: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onFiles(Array.from(fileList));
    },
    [onFiles],
  );

  const onDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "group w-full relative overflow-hidden rounded-[12px]",
        "flex flex-col items-center justify-center gap-2 p-6 text-center",
        "bg-paper border-2 border-dashed",
        "transition-[border-color,background-color,transform] duration-150 ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-2 focus-visible:outline-ink",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        dragOver
          ? "border-ink bg-ink/5 scale-[1.01]"
          : "border-ink/25 hover:border-ink/55 hover:bg-ink/[0.02]",
        SIZE[size],
        className,
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
          dragOver ? "bg-ink text-paper" : "bg-ink/5 text-ink/70 group-hover:bg-ink/10",
        )}
      >
        {icon ?? DEFAULT_ICON}
      </span>
      <span className="text-[14px] fw-480 tracking-[-0.14px] text-ink leading-tight">
        {label}
      </span>
      {hint ? (
        <span className="text-[12px] fw-330 tracking-[-0.14px] text-ink/55 leading-tight">
          {hint}
        </span>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          // reset so selecting the same file fires change
          e.target.value = "";
        }}
      />
    </button>
  );
}

export interface UploadPreviewGridProps {
  items: Array<{ id: string; url: string }>;
  onRemove?: (id: string) => void;
  slots?: number;
  renderEmpty?: () => ReactNode;
  columns?: 3 | 4 | 5;
  className?: string;
}

export function UploadPreviewGrid({
  items,
  onRemove,
  slots,
  renderEmpty,
  columns = 3,
  className,
}: UploadPreviewGridProps) {
  const colClass = { 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" }[columns];
  return (
    <div className={cn("grid gap-2.5", colClass, className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className="relative aspect-square rounded-[10px] overflow-hidden border border-ink/10 bg-ink/5 group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt="" className="h-full w-full object-cover" />
          {onRemove ? (
            <button
              type="button"
              aria-label="Remove"
              onClick={() => onRemove(item.id)}
              className={cn(
                "absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-paper/90 backdrop-blur",
                "flex items-center justify-center text-ink",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "hover:bg-paper shadow-[0_2px_6px_rgba(0,0,0,0.15)]",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      ))}
      {slots
        ? Array.from({ length: Math.max(0, slots - items.length) }, (_, i) => (
            <div
              key={`slot-${i}`}
              className="aspect-square rounded-[10px] border border-dashed border-ink/15 bg-transparent"
            >
              {renderEmpty?.()}
            </div>
          ))
        : null}
    </div>
  );
}
