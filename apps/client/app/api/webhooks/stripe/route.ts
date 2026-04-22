import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma, type Plan, type ClientStatus } from "@wowcut/db";
import { slugify, PLAN_LIMITS } from "@wowcut/shared";

type PlanId = Plan;

function planFromMetadata(planMeta: string | undefined): PlanId {
  if (planMeta === "week_pass") return "week_pass";
  if (planMeta === "premium") return "premium";
  if (planMeta === "base_annual") return "base_annual";
  if (planMeta === "premium_annual") return "premium_annual";
  return "base";
}

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const name = session.customer_details?.name ?? email ?? "New Client";
    if (!email) return NextResponse.json({ received: true });

    const slug = slugify(name);
    const previewId = (session.metadata?.previewId as string | undefined) ?? null;
    const plan = planFromMetadata(session.metadata?.plan as string | undefined);
    const initialStatus: ClientStatus =
      plan === "week_pass" ? "week_pass_active" : "onboarding_confirm";
    const weekPassExpiresAt =
      plan === "week_pass"
        ? new Date(Date.now() + PLAN_LIMITS.week_pass.durationDays! * 24 * 60 * 60 * 1000)
        : null;

    await prisma.client.upsert({
      where: { email },
      update: {
        stripeCustomerId: (session.customer as string) ?? null,
        stripeSubscriptionId: (session.subscription as string) ?? null,
        plan,
        status: initialStatus,
        weekPassExpiresAt,
        ...(previewId ? { convertedFromPreviewId: previewId } : {}),
      },
      create: {
        email,
        name,
        slug,
        plan,
        status: initialStatus,
        stripeCustomerId: (session.customer as string) ?? null,
        stripeSubscriptionId: (session.subscription as string) ?? null,
        convertedFromPreviewId: previewId,
        weekPassExpiresAt,
      },
    });
  }

  // Handle pause resumption / cancellation
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const existing = await prisma.client.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (existing) {
      const status = subscription.status;
      if (status === "canceled") {
        await prisma.client.update({
          where: { id: existing.id },
          data: { status: "cancelled" },
        });
      } else if (status === "active" && existing.status === "paused") {
        await prisma.client.update({
          where: { id: existing.id },
          data: { status: "active", pausedAt: null, pausedUntil: null },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
