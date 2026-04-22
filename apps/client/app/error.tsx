"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-[96px] leading-none font-[540] tracking-[-1.72px]">500</div>
        <p className="mt-4 text-body fw-340 text-ink/70">
          Something went wrong on our side.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-pill bg-ink text-paper text-body fw-450"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-pill border border-ink text-ink text-body fw-450"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
