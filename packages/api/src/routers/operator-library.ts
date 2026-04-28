import { z } from "zod";
import { router, operatorProcedure, adminProcedure } from "../trpc";

export const operatorLibraryRouter = router({
  brandFaces: operatorProcedure.query(async ({ ctx }) => {
    const faces = await ctx.prisma.brandFace.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });
    const clientCounts = await ctx.prisma.client.groupBy({
      by: ["brandFaceId"],
      where: { brandFaceId: { not: null } },
      _count: { id: true },
    });
    const countMap = Object.fromEntries(
      clientCounts.map((r) => [r.brandFaceId!, r._count.id]),
    );
    return faces.map((f) => ({ ...f, clientCount: countMap[f.id] ?? 0 }));
  }),

  createBrandFace: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(80),
        referenceUrl: z.string().url(),
        descriptors: z.record(z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.brandFace.create({
        data: {
          name: input.name,
          referenceUrl: input.referenceUrl,
          descriptors: input.descriptors as never,
        },
      });
    }),

  toggleBrandFace: adminProcedure
    .input(z.object({ id: z.string(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.brandFace.update({
        where: { id: input.id },
        data: { active: input.active },
      });
    }),

  updateBrandFace: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(80).optional(),
        referenceUrl: z.string().url().optional(),
        descriptors: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, referenceUrl, descriptors } = input;
      return ctx.prisma.brandFace.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(referenceUrl !== undefined && { referenceUrl }),
          ...(descriptors !== undefined && { descriptors: descriptors as never }),
        },
      });
    }),
});
