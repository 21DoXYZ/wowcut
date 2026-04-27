import Link from "next/link";
import Image from "next/image";
import { Button, MonoLabel } from "@wowcut/ui/components";

const HERO_COLS: { src: string; rotate: number }[][] = [
  [
    { src: "/style-refs/social/1.jpeg",   rotate: -1.5 },
    { src: "/style-refs/editorial/1.png", rotate: 1    },
  ],
  [
    { src: "/style-refs/cgi/1.png",       rotate: 2    },
    { src: "/style-refs/social/3.png",    rotate: -0.5 },
  ],
  [
    { src: "/style-refs/fashion/1.png",   rotate: 1.5  },
    { src: "/style-refs/editorial/3.png", rotate: -1   },
  ],
];

const STATS = [
  { value: "20", unit: "assets / mo", label: "Base plan" },
  { value: "60s", unit: "preview", label: "No signup" },
  { value: "4", unit: "styles", label: "Social · Editorial · CGI · Fashion" },
  { value: "$49", unit: "week pass", label: "First try" },
];

const STYLES: { id: string; tag: string; title: string; body: string; main: string; thumbs: string[] }[] = [
  {
    id: "social_style",
    tag: "Instagram · TikTok",
    title: "Social Style",
    body: "UGC-feel, native contexts, everyday light. Designed to stop the scroll.",
    main: "/style-refs/social/4.jpeg",
    thumbs: ["/style-refs/social/2.png", "/style-refs/social/1.jpeg"],
  },
  {
    id: "editorial_hero",
    tag: "Catalog · PDP",
    title: "Editorial Hero",
    body: "Studio-grade composition, neutral ground, precise lighting. Built for e-com.",
    main: "/style-refs/editorial/2.png",
    thumbs: ["/style-refs/editorial/4.png", "/style-refs/editorial/1.png"],
  },
  {
    id: "cgi_concept",
    tag: "Hero · Campaign",
    title: "CGI Concept",
    body: "Physics-defying, impossible sets, viral hook moments. For brands that want attention.",
    main: "/style-refs/cgi/2.png",
    thumbs: ["/style-refs/cgi/4.png", "/style-refs/cgi/3.jpeg"],
  },
  {
    id: "fashion_campaign",
    tag: "Fashion · Beauty",
    title: "With Model",
    body: "Your product styled on a person. Aspirational, brand-story feel. Converts.",
    main: "/style-refs/fashion/1.png",
    thumbs: ["/style-refs/fashion/2.png", "/style-refs/fashion/3.jpeg"],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload in 2 minutes",
    body: "Drop 1-3 product photos and style references. Pick your brand color. No brief, no call.",
    detail: "Free - No account needed",
  },
  {
    n: "02",
    title: "See your moodboard",
    body: "60-90 seconds. We generate 9 images across styles tailored to your product. Favorite what you love.",
    detail: "9 scenes - 3-4 styles",
  },
  {
    n: "03",
    title: "Go live weekly",
    body: "Pay once or subscribe. Every Monday: 5 final assets, captions, hashtags, CSV. Retry any unit, pause anytime.",
    detail: "From $49 week pass - $250/mo",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0A0908]">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-[#7a3bff] opacity-[0.07] blur-[120px] pointer-events-none" />

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 pt-20 md:pt-28 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-center">
            {/* Left: copy */}
            <div className="max-w-[560px]">
              <div className="inline-flex items-center gap-2 rounded-pill border border-paper/10 bg-paper/5 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#86FF6B] animate-pulse" />
                <MonoLabel size="sm" className="text-paper/60">
                  AI content production
                </MonoLabel>
              </div>

              <h1 className="mt-8 text-paper landing-display">
                Content your brand
                <br />
                <span className="text-paper/40">would actually post.</span>
              </h1>

              <p className="mt-6 text-[17px] md:text-[18px] fw-330 tracking-[-0.2px] leading-[1.55] text-paper/60 max-w-[48ch]">
                Upload products and references. We produce 20 on-brand assets every
                month - static, motion, captions - for beauty and fashion brands
                that can&rsquo;t keep up with feed demand.
              </p>

              <div className="mt-10 flex items-center gap-3 flex-wrap">
                <Link href="/try">
                  <Button variant="white" size="lg">
                    See your brand free
                  </Button>
                </Link>
                <Link href="/pricing">
                  <button className="h-12 px-5 rounded-pill border border-paper/15 text-paper/70 text-[14px] fw-440 tracking-[-0.14px] hover:border-paper/35 hover:text-paper transition-colors">
                    Pricing →
                  </button>
                </Link>
              </div>

              <p className="mt-5 text-[12px] fw-330 text-paper/35 tracking-[-0.1px]">
                60-second preview · no signup · no card
              </p>
            </div>

            {/* Right: real image moodboard */}
            <div className="hidden lg:flex items-end gap-3 pb-2 flex-shrink-0">
              {HERO_COLS.map((col, ci) => (
                <div
                  key={ci}
                  className="flex flex-col gap-3"
                  style={{ marginBottom: ci === 0 ? "2rem" : ci === 2 ? "1rem" : "0" }}
                >
                  {col.map((card, i) => (
                    <div
                      key={i}
                      className="relative w-[140px] sm:w-[155px] aspect-[3/4] rounded-[14px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.55)] flex-shrink-0"
                      style={{ transform: `rotate(${card.rotate}deg)` }}
                    >
                      <Image src={card.src} alt="" fill className="object-cover" sizes="160px" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-y border-ink/8 bg-[#F7F5F2]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="py-7 px-4 md:px-8 flex flex-col gap-0.5 border-r last:border-r-0 border-ink/8"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[32px] fw-540 tracking-[-1px] leading-none text-ink">
                    {s.value}
                  </span>
                  <span className="text-[13px] fw-440 text-ink/45 tracking-[-0.1px]">
                    {s.unit}
                  </span>
                </div>
                <MonoLabel size="sm" className="text-ink/40">
                  {s.label}
                </MonoLabel>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STYLES */}
      <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 md:py-28">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
          <div>
            <MonoLabel className="text-ink/45">Output formats</MonoLabel>
            <h2 className="mt-3 brand-heading max-w-[22ch]">
              Four styles. Every feed covered.
            </h2>
          </div>
          <Link
            href="/try"
            className="text-[14px] fw-440 tracking-[-0.14px] text-ink/55 hover:text-ink transition-colors underline underline-offset-4 decoration-1"
          >
            See yours in 60s →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STYLES.map((s) => (
            <div
              key={s.id}
              className="rounded-[18px] overflow-hidden border border-ink/8 hover:border-ink/20 transition-colors group"
            >
              {/* image strip — 3 stacked thumbnails */}
              <div className="relative aspect-[3/4] overflow-hidden bg-ink/5">
                {/* main image */}
                <Image
                  src={s.main}
                  alt={s.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width:768px) 50vw, 25vw"
                />
                {/* tag overlay */}
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] fw-540 tracking-[0.4px] uppercase px-2.5 py-1 rounded-full bg-ink/60 text-paper/90 backdrop-blur-sm">
                    {s.tag}
                  </span>
                </div>
                {/* small preview strip bottom */}
                <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-ink/60 to-transparent flex items-end gap-1.5 p-3">
                  {s.thumbs.map((img, i) => (
                    <div
                      key={i}
                      className="relative h-12 w-9 rounded-[6px] overflow-hidden flex-shrink-0 border border-paper/20"
                    >
                      <Image src={img} alt="" fill className="object-cover" sizes="36px" />
                    </div>
                  ))}
                </div>
              </div>

              {/* text */}
              <div className="p-4 bg-paper">
                <h3 className="text-[17px] fw-540 tracking-[-0.3px] leading-[1.2] text-ink">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-[13px] fw-330 tracking-[-0.14px] leading-[1.5] text-ink/55">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#0A0908]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 md:py-28">
          <div className="mb-14">
            <MonoLabel className="text-paper/40">Process</MonoLabel>
            <h2 className="mt-3 brand-heading text-paper max-w-[20ch]">
              Three steps. Then it runs itself.
            </h2>
          </div>

          <div className="grid gap-px md:grid-cols-3 bg-paper/8 rounded-[20px] overflow-hidden">
            {STEPS.map((step) => (
              <div key={step.n} className="bg-[#0A0908] p-8 md:p-10 flex flex-col gap-6">
                <MonoLabel className="text-paper/25">{step.n}</MonoLabel>
                <div>
                  <h3 className="text-[22px] fw-540 tracking-[-0.4px] leading-[1.2] text-paper">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[15px] fw-330 tracking-[-0.14px] leading-[1.6] text-paper/55">
                    {step.body}
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-paper/8">
                  <MonoLabel size="sm" className="text-paper/30">
                    {step.detail}
                  </MonoLabel>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="relative overflow-hidden hero-gradient">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 60% 40%, #ffffff44 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 py-24 md:py-32">
          <div className="max-w-[600px]">
            <MonoLabel className="text-ink/60">Start free</MonoLabel>
            <h2 className="mt-4 brand-heading text-ink max-w-[18ch]">
              See what your brand looks like on Wowcut.
            </h2>
            <p className="mt-5 text-[17px] fw-330 tracking-[-0.14px] leading-[1.5] text-ink/75 max-w-[50ch]">
              9 images tailored to your product and references. No signup,
              no card, 60 seconds flat.
            </p>
            <div className="mt-10 flex items-center gap-4 flex-wrap">
              <Link href="/try">
                <Button variant="black" size="lg">
                  Generate my moodboard
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-[13px] fw-330 text-ink/60">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                No account needed
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
