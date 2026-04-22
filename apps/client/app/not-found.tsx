import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-[96px] leading-none font-[540] tracking-[-1.72px]">404</div>
        <p className="mt-4 text-body fw-340 text-ink/70">
          This page doesn&rsquo;t exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block px-5 py-2.5 rounded-pill bg-ink text-paper text-body fw-450"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
