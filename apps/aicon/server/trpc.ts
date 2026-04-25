import { initTRPC } from "@trpc/server";
import { prisma } from "@wowcut/db";
import superjson from "superjson";

export const createContext = () => ({ prisma });
export type Context = ReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
