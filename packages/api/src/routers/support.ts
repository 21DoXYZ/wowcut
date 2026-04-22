import { z } from "zod";
import { router, clientProcedure, operatorProcedure } from "../trpc";

export const supportRouter = router({
  thread: clientProcedure.query(async ({ ctx }) => {
    const messages = await ctx.prisma.message.findMany({
      where: { clientId: ctx.session.clientId! },
      orderBy: { createdAt: "asc" },
    });
    await ctx.prisma.message.updateMany({
      where: { clientId: ctx.session.clientId!, sender: "operator", readByClient: false },
      data: { readByClient: true },
    });
    return messages;
  }),

  sendFromClient: clientProcedure
    .input(z.object({ body: z.string().min(1).max(4000), attachments: z.array(z.string()).max(5).default([]) }))
    .mutation(async ({ ctx, input }) => {
      const msg = await ctx.prisma.message.create({
        data: {
          clientId: ctx.session.clientId!,
          sender: "client",
          senderId: ctx.session.clientId!,
          body: input.body,
          attachments: input.attachments,
          readByClient: true,
        },
      });
      return msg;
    }),

  threadForClient: operatorProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.message.findMany({
        where: { clientId: input.clientId },
        orderBy: { createdAt: "asc" },
      });
      await ctx.prisma.message.updateMany({
        where: { clientId: input.clientId, sender: "client", readByOperator: false },
        data: { readByOperator: true },
      });
      return messages;
    }),

  sendFromOperator: operatorProcedure
    .input(
      z.object({
        clientId: z.string(),
        body: z.string().min(1).max(4000),
        attachments: z.array(z.string()).max(5).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.message.create({
        data: {
          clientId: input.clientId,
          sender: "operator",
          senderId: ctx.session.actorId,
          body: input.body,
          attachments: input.attachments,
          readByOperator: true,
        },
      });
    }),
});
