import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@wowcut/db";
import { getCurrentClient } from "@/lib/session";

export async function POST() {
  const current = await getCurrentClient();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const client = await prisma.client.findUnique({
    where: { id: current.clientId },
    select: { stripeSubscriptionId: true, status: true },
  });
  if (!client?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No Stripe subscription" }, { status: 400 });
  }
  if (client.status !== "paused") {
    return NextResponse.json({ error: "Subscription is not paused" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  await stripe.subscriptions.update(client.stripeSubscriptionId, {
    pause_collection: null,
  });

  await prisma.client.update({
    where: { id: current.clientId },
    data: { status: "active", pausedAt: null, pausedUntil: null },
  });

  return NextResponse.json({ ok: true });
}
