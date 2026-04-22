import Link from "next/link";
import { Button, Card, MonoLabel, Badge } from "@wowcut/ui/components";

interface Plan {
  id: string;
  eyebrow: string;
  name: string;
  price: string;
  period: string;
  units: string;
  tagline: string;
  includes: string[];
  excluded?: string[];
  cta: string;
  ctaHref: string;
  highlight?: boolean;
  variant: "bordered" | "emphasis";
}

const PLANS: Plan[] = [
  {
    id: "week_pass",
    eyebrow: "Trial",
    name: "Week Pass",
    price: "$49",
    period: "one-time · 7 days",
    units: "5 finals",
    tagline: "See if Wowcut fits before committing.",
    includes: [
      "5 unwatermarked assets in 48 hours",
      "Publishing Pack (CSV + captions + hashtags)",
      "Library access for 7 days",
      "Social / Editorial / CGI styles",
    ],
    excluded: ["Motion video", "Retry requests", "Calendar, Insights, Support chat", "Trend Drops"],
    cta: "Start trial — $49",
    ctaHref: "/checkout?plan=week_pass",
    variant: "bordered",
  },
  {
    id: "base",
    eyebrow: "Most popular",
    name: "Base",
    price: "$250",
    period: "per month",
    units: "20 units / month",
    tagline: "Keep your feed moving, every week.",
    includes: [
      "20 on-brand assets per month",
      "Social / Editorial / CGI styles",
      "Static + Animated Still + Short Motion (up to 6)",
      "Publishing Pack (files + captions + hashtags + CSV)",
      "Weekly delivery + 1 retry / week",
      "Monthly Trend Drop (2 bonus units)",
    ],
    excluded: ["Fashion Campaign (Premium only)", "Strategy call"],
    cta: "Start with Base",
    ctaHref: "/checkout?plan=base",
    highlight: true,
    variant: "emphasis",
  },
  {
    id: "premium",
    eyebrow: "Scale",
    name: "Premium",
    price: "$500",
    period: "per month",
    units: "30 units / month",
    tagline: "Campaigns, lookbooks, model consistency.",
    includes: [
      "Everything in Base",
      "Fashion Campaign (up to 8 units)",
      "Brand-face consistency lock",
      "1 strategy call / month",
      "2 retries per week",
      "Priority queue",
    ],
    excluded: ["Paid seeding / ads", "Influencer outreach"],
    cta: "Start with Premium",
    ctaHref: "/checkout?plan=premium",
    variant: "bordered",
  },
];

export const metadata = { title: "Wowcut pricing" };

export default function PricingPage() {
  return (
    <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 md:py-28">
      <div className="max-w-[42ch]">
        <MonoLabel>Pricing</MonoLabel>
        <h1 className="mt-3 brand-heading">Start small. Scale when it clicks.</h1>
        <p className="mt-4 text-[16px] fw-340 leading-[1.5] text-ink/70">
          Annual prepay saves 15% — same output, two months free. Cancel anytime.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card
            key={p.id}
            variant={p.variant}
            noPadding
            className="relative flex flex-col overflow-hidden"
          >
            {p.highlight && (
              <div className="absolute top-4 right-4 z-10">
                <Badge tone="trend">{p.eyebrow}</Badge>
              </div>
            )}
            <div className={p.highlight ? "p-7 pt-8" : "p-6"}>
              {!p.highlight && (
                <MonoLabel size="sm" className="text-ink/55 block mb-4">{p.eyebrow}</MonoLabel>
              )}
              <h2 className="text-[22px] fw-540 tracking-[-0.3px] text-ink">{p.name}</h2>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[56px] leading-none fw-540 tracking-[-1.5px]">{p.price}</span>
                <span className="text-[13px] fw-340 tracking-[-0.14px] text-ink/55">{p.period}</span>
              </div>
              <div className="mt-2 text-[15px] fw-540 tracking-[-0.2px] text-ink">{p.units}</div>
              <p className="mt-2 text-[14px] fw-340 leading-[1.5] text-ink/70">{p.tagline}</p>
            </div>

            <div className="px-6 pb-6 md:px-7 md:pb-7 flex-1 flex flex-col">
              <ul className="space-y-2.5 mb-5">
                {p.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[14px] fw-340 text-ink leading-[1.4]">
                    <span aria-hidden className="mt-[5px] shrink-0 inline-flex items-center justify-center h-4 w-4 rounded-full bg-ink text-paper text-[10px]">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {p.excluded && p.excluded.length > 0 && (
                <ul className="space-y-1.5 mb-6">
                  {p.excluded.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px] fw-330 text-ink/40 leading-[1.4]">
                      <span aria-hidden className="mt-[5px] shrink-0 inline-flex items-center justify-center h-4 w-4 rounded-full bg-ink/8 text-ink/40 text-[10px]">
                        —
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto">
                <Link href={p.ctaHref}>
                  <Button
                    variant={p.highlight ? "black" : "outline"}
                    size="md"
                    fullWidth
                  >
                    {p.cta}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-16 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 rounded-[12px] bg-ink text-paper">
        <div className="max-w-[48ch]">
          <MonoLabel size="sm" className="text-paper/50">Not ready yet?</MonoLabel>
          <p className="mt-2 text-[18px] fw-480 tracking-[-0.2px] text-paper leading-[1.35]">
            Try a free moodboard first — see your brand in 9 directions.
          </p>
        </div>
        <Link href="/try">
          <Button variant="white" size="md">See my brand — free</Button>
        </Link>
      </div>
    </section>
  );
}
