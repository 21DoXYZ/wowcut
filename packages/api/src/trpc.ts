import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { ServerContext } from "./context";

const t = initTRPC.context<ServerContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const mergeRouters = t.mergeRouters;
export const publicProcedure = t.procedure;

export const clientProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.session.role !== "client" || !ctx.session.clientId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Client auth required" });
  }
  return next({ ctx: { ...ctx, session: { ...ctx.session, clientId: ctx.session.clientId } } });
});

export const operatorProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.session.role !== "operator" && ctx.session.role !== "admin") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Operator auth required" });
  }
  return next();
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.session.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin auth required" });
  }
  return next();
});
