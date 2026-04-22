import { z } from "zod";
import { router, clientProcedure } from "../trpc";

const BriefUpdateSchema = z.object({
  newSkus: z
    .array(
      z.object({
        name: z.string(),
        category: z.string(),
        imageUploadId: z.string(),
      }),
    )
    .optional(),
  promos: z.string().max(500).optional(),
  styleChange: z.string().optional(),
  channelChange: z.array(z.string()).optional(),
});

export const briefRouter = router({
  submitUpdate: clientProcedure.input(BriefUpdateSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.briefUpdate.create({
      data: {
        clientId: ctx.session.clientId!,
        source: "client_self",
        changes: input,
      },
    });
  }),

  recent: clientProcedure.query(async ({ ctx }) => {
    return ctx.prisma.briefUpdate.findMany({
      where: { clientId: ctx.session.clientId! },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }),
});
