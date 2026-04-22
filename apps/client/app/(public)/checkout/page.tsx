import { redirect } from "next/navigation";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

function resolvePrice(plan: string | undefined): { priceId: string | undefined; mode: "subscription" | "payment" } {
  switch (plan) {
    case "week_pass":
      return { priceId: process.env.STRIPE_PRICE_ID_WEEK_PASS, mode: "payment" };
    case "premium":
      return { priceId: process.env.STRIPE_PRICE_ID_PREMIUM, mode: "subscription" };
    case "base_annual":
      return { priceId: process.env.STRIPE_PRICE_ID_BASE_ANNUAL, mode: "subscription" };
    case "premium_annual":
      return { priceId: process.env.STRIPE_PRICE_ID_PREMIUM_ANNUAL, mode: "subscription" };
    case "base":
    default:
      return { priceId: process.env.STRIPE_PRICE_ID_BASE, mode: "subscription" };
  }
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string; preview?: string };
}) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const { priceId, mode } = resolvePrice(searchParams.plan);

  if (!stripeKey || !priceId) {
    return (
      <div className="max-w-[560px] mx-auto px-6 py-20">
        <h1 className="brand-subheading">Stripe is not configured yet</h1>
        <p className="mt-4 text-body fw-330 text-ink/70">
          Set <code>STRIPE_SECRET_KEY</code> and the matching <code>STRIPE_PRICE_ID_*</code>.
        </p>
      </div>
    );
  }

  const stripe = new Stripe(stripeKey);
  const metadata = {
    plan: searchParams.plan ?? "base",
    ...(searchParams.preview ? { previewId: searchParams.preview } : {}),
  };

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/pricing`,
    allow_promotion_codes: mode === "subscription",
    metadata,
    ...(mode === "subscription"
      ? { subscription_data: { metadata } }
      : {}),
  });

  if (!session.url) {
    return <div className="max-w-[560px] mx-auto px-6 py-20">Something went wrong.</div>;
  }

  redirect(session.url);
}
