import { z } from "zod";
import { router, clientProcedure } from "../trpc";

export const calendarRouter = router({
  upcomingWeeks: clientProcedure.query(async ({ ctx }) => {
    const items = await ctx.prisma.contentPlanItem.findMany({
      where: { clientId: ctx.session.clientId! },
      orderBy: [{ weekKey: "asc" }, { slotIndex: "asc" }],
      include: { sku: true, chosenGeneration: true },
    });
    const grouped: Record<string, typeof items> = {};
    for (const item of items) {
      (grouped[item.weekKey] ??= []).push(item);
    }
    return grouped;
  }),

  requestSkuForSlot: clientProcedure
    .input(z.object({ slotId: z.string(), note: z.string().max(300) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.contentPlanItem.updateMany({
        where: { id: input.slotId, clientId: ctx.session.clientId! },
        data: {
          operatorNotes: input.note,
          tags: { push: "client_request" },
        },
      });
      return { ok: true };
    }),
});
