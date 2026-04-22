import Link from "next/link";
import { Button, Card, CardTitle, CardDescription, MonoLabel, Badge } from "@wowcut/ui/components";

const STYLES = [
  {
    id: "social_style",
    title: "Social Style",
    description: "UGC-feel, native feed content, everyday contexts.",
    gradient: "from-[#86FF6B] to-[#FFE24B]",
    tag: "Instagram · TikTok",
  },
  {
    id: "editorial_hero",
    title: "Editorial Hero",
    description: "E-commerce catalog, clean studio light, hero shots.",
    gradient: "from-[#1A1A1A] to-[#3E3E3E]",
    tag: "Catalog · PDP",
  },
  {
    id: "cgi_concept",
    title: "CGI Concept",
    description: "Viral hooks, physics-defying, brand stunt moments.",
    gradient: "from-[#7A3BFF] to-[#FF4BD4]",
    tag: "Hero · Campaign",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Free moodboard",
    body: "Upload products + references. We build 9 samples of your brand in 3 styles — no signup, 60-90 seconds.",
  },
  {
    number: "02",
    title: "Confirm and pay",
    body: "Pick the ones you love. Start with $49 Week Pass or $250/mo Base. One click and production begins.",
  },
  {
    number: "03",
    title: "Weekly deliveries",
    body: "5 ready-to-post assets every Monday — captions, hashtags, and CSV included. Retry any unit.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden hero-gradient surface-scrim">
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 pt-20 md:pt-28 pb-24 md:pb-32 text-ink">
          <div className="inline-flex items-center gap-2 rounded-pill bg-paper/40 backdrop-blur-md px-3 py-1.5 border border-paper/50 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            <span className="h-1.5 w-1.5 rounded-full bg-ink animate-pulse" />
            <MonoLabel size="sm" className="text-ink/80">Content on autopilot</MonoLabel>
          </div>
          <h1 className="mt-7 brand-heading-display max-w-[16ch]">
            20 on-brand assets,
            <br className="hidden sm:block" /> every month. On autopilot.
          </h1>
          <p className="mt-6 text-[17px] md:text-[19px] fw-340 tracking-[-0.14px] max-w-[56ch] leading-[1.45] text-ink/85">
            Upload products and references. We produce a month of ready-to-post
            content — static, motion, captions and hashtags. For beauty and fashion
            brands that can&rsquo;t keep up with feed demand.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/try">
              <Button variant="black" size="lg">See your brand — free preview</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="glassLight" size="lg" className="text-ink border-ink/20 bg-paper/50 hover:bg-paper/70">
                See pricing
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Badge tone="ink" dot>New</Badge>
            <MonoLabel size="sm" className="text-ink/70">Preview renders in 60-90 seconds</MonoLabel>
            <span className="h-1 w-1 rounded-full bg-ink/30" />
            <MonoLabel size="sm" className="text-ink/70">From $49 · 1-week trial</MonoLabel>
          </div>
        </div>
      </section>

      {/* STYLES */}
      <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 md:py-28">
        <div className="flex items-end justify-between gap-8 flex-wrap mb-12">
          <div>
            <MonoLabel>Three styles, every feed</MonoLabel>
            <h2 className="mt-3 brand-heading max-w-[18ch]">
              Pick what fits. We rotate your SKUs.
            </h2>
          </div>
          <Link href="/pricing" className="text-[14px] fw-440 tracking-[-0.14px] underline underline-offset-4 decoration-1 text-ink hover:decoration-2">
            See how much →
          </Link>
        </div>
        <div className="grid gap-4 md:gap-5 md:grid-cols-3">
          {STYLES.map((s) => (
            <Card key={s.id} variant="bordered" noPadding className="overflow-hidden group hover:border-ink/30 transition-colors">
              <div className={`aspect-[4/5] bg-gradient-to-br ${s.gradient} relative`}>
                <div className="absolute top-4 left-4">
                  <Badge tone="neutral" className="bg-paper/90 backdrop-blur">{s.tag}</Badge>
                </div>
              </div>
              <div className="p-5">
                <CardTitle className="text-[20px]">{s.title}</CardTitle>
                <CardDescription className="text-[14px]">{s.description}</CardDescription>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-ink text-paper">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 md:py-28 grid gap-12 lg:gap-16 lg:grid-cols-[1fr_1.2fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <MonoLabel className="text-paper/50">How it works</MonoLabel>
            <h2 className="mt-3 brand-heading text-paper">
              Three touchpoints. That&rsquo;s it.
            </h2>
            <p className="mt-4 text-[16px] fw-340 leading-[1.5] text-paper/70 max-w-md">
              No calls, no briefs, no approvals. Upload once. Get content every week.
            </p>
          </div>
          <ol className="space-y-8 lg:space-y-10">
            {STEPS.map((step) => (
              <li key={step.number} className="grid grid-cols-[auto_1fr] gap-5 items-start">
                <div className="flex items-center justify-center h-12 w-12 rounded-full border border-paper/25 text-paper">
                  <MonoLabel className="text-paper">{step.number}</MonoLabel>
                </div>
                <div>
                  <h3 className="text-[22px] fw-540 tracking-[-0.3px] leading-[1.2] text-paper">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[15px] fw-340 leading-[1.5] text-paper/75 max-w-[52ch]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 py-20 md:py-28 text-center">
          <MonoLabel className="text-ink/70">Ready?</MonoLabel>
          <h2 className="mt-3 brand-heading max-w-[20ch] mx-auto">
            See your brand in Wowcut style.
          </h2>
          <p className="mt-4 text-[16px] fw-340 leading-[1.5] max-w-[52ch] mx-auto text-ink/80">
            A 9-image moodboard, tailored to your product and references. No signup, no card.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/try">
              <Button variant="black" size="lg">Start free preview</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
