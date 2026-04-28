import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { PAUSE } from "@wowcut/shared";
import { router, clientProcedure } from "../trpc";

export const subscriptionRouter = router({
  current: clientProcedure.query(async ({ ctx }) => {
    const client = await ctx.prisma.client.findUnique({
      where: { id: ctx.session.clientId! },
      select: {
        plan: true,
        status: true,
        stripeSubscriptionId: true,
        weekPassExpiresAt: true,
        pausedAt: true,
        pausedUntil: true,
      },
    });
    if (!client) throw new TRPCError({ code: "NOT_FOUND" });
    return client;
  }),

  pause: clientProcedure
    .input(z.object({ months: z.number().int().min(PAUSE.minMonths).max(PAUSE.maxMonths) }))
    .mutation(async ({ ctx, input }) => {
      const client = await ctx.prisma.client.findUnique({ where: { id: ctx.session.clientId! } });
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      if (client.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only active subscriptions can be paused",
        });
      }

      const now = new Date();
      const until = new Date(now);
      until.setMonth(until.getMonth() + input.months);

      await ctx.prisma.client.update({
        where: { id: client.id },
        data: {
          status: "paused",
          pausedAt: now,
          pausedUntil: until,
        },
      });

      // Stripe pause_collection should be triggered via webhook handler on resume,
      // but we record intent here. Actual Stripe call happens in /api/stripe/pause route.
      return { pausedUntil: until };
    }),

  resume: clientProcedure.mutation(async ({ ctx }) => {
    const client = await ctx.prisma.client.findUnique({ where: { id: ctx.session.clientId! } });
    if (!client) throw new TRPCError({ code: "NOT_FOUND" });
    if (client.status !== "paused") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Subscription is not paused" });
    }
    await ctx.prisma.client.update({
      where: { id: client.id },
      data: {
        status: "active",
        pausedAt: null,
        pausedUntil: null,
      },
    });
    return { ok: true };
  }),

  preferences: clientProcedure.query(async ({ ctx }) => {
    const client = await ctx.prisma.client.findUnique({
      where: { id: ctx.session.clientId! },
      select: { emailNotifications: true, trendDropOptOut: true },
    });
    if (!client) throw new TRPCError({ code: "NOT_FOUND" });
    return client;
  }),

  updatePreferences: clientProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        trendDropOptOut: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.client.update({
        where: { id: ctx.session.clientId! },
        data: {
          ...(input.emailNotifications !== undefined && {
            emailNotifications: input.emailNotifications,
          }),
          ...(input.trendDropOptOut !== undefined && {
            trendDropOptOut: input.trendDropOptOut,
          }),
        },
      });
      return { ok: true };
    }),

  cancelAtPeriodEnd: clientProcedure.mutation(async ({ ctx }) => {
    const client = await ctx.prisma.client.findUnique({ where: { id: ctx.session.clientId! } });
    if (!client) throw new TRPCError({ code: "NOT_FOUND" });
    // The actual Stripe cancel_at_period_end flag is set via /api/stripe/cancel route,
    // this mutation marks intent.
    await ctx.prisma.briefUpdate.create({
      data: {
        clientId: client.id,
        source: "client_self",
        changes: { type: "cancel_intent", at: new Date().toISOString() },
      },
    });
    return { ok: true };
  }),
});
