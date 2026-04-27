import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@wowcut/db";
import { getCurrentClient } from "@/lib/session";

export async function GET() {
  const current = await getCurrentClient();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  const client = await prisma.client.findUnique({
    where: { id: current.clientId },
    select: { stripeCustomerId: true },
  });
  if (!client?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  const session = await stripe.billingPortal.sessions.create({
    customer: client.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/settings`,
  });

  return NextResponse.redirect(session.url);
}
