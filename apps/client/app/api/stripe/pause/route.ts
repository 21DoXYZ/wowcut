import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@wowcut/db";
import { PAUSE } from "@wowcut/shared";
import { getCurrentClient } from "@/lib/session";

export async function POST(req: Request) {
  const current = await getCurrentClient();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = (await req.json().catch(() => ({}))) as { months?: number };
  const months = Math.max(PAUSE.minMonths, Math.min(PAUSE.maxMonths, Number(body.months ?? 1)));

  const client = await prisma.client.findUnique({
    where: { id: current.clientId },
    select: { stripeSubscriptionId: true, status: true },
  });

  if (!client?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No Stripe subscription" }, { status: 400 });
  }
  if (client.status !== "active") {
    return NextResponse.json({ error: "Only active subscriptions can be paused" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  const resumeAt = new Date();
  resumeAt.setMonth(resumeAt.getMonth() + months);

  await stripe.subscriptions.update(client.stripeSubscriptionId, {
    pause_collection: {
      behavior: "keep_as_draft",
      resumes_at: Math.floor(resumeAt.getTime() / 1000),
    },
    metadata: { pausedAt: new Date().toISOString(), pausedMonths: String(months) },
  });

  await prisma.client.update({
    where: { id: current.clientId },
    data: {
      status: "paused",
      pausedAt: new Date(),
      pausedUntil: resumeAt,
    },
  });

  return NextResponse.json({ ok: true, pausedUntil: resumeAt.toISOString() });
}
