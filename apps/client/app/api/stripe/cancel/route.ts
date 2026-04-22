import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@wowcut/db";
import { getCurrentClient } from "@/lib/session";

export async function POST() {
  const current = await getCurrentClient();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  const client = await prisma.client.findUnique({
    where: { id: current.clientId },
    select: { stripeSubscriptionId: true },
  });
  if (!client?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No Stripe subscription" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  await stripe.subscriptions.update(client.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.auditLog.create({
    data: {
      actor: current.clientId,
      action: "stripe_cancel_at_period_end",
      entity: `client:${current.clientId}`,
    },
  });

  return NextResponse.json({ ok: true });
}
