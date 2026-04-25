import { initTRPC } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { prisma } from "@wowcut/db";
import superjson from "superjson";
import crypto from "node:crypto";

function extractIpHash(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : null) ?? req.headers.get("x-real-ip") ?? "unknown";
  // Hash so we never persist raw IPs anywhere.
  return crypto.createHash("sha256").update(ip.trim()).digest("hex").slice(0, 24);
}

export const createContext = (opts?: FetchCreateContextFnOptions) => ({
  prisma,
  ipHash: opts ? extractIpHash(opts.req) : "unknown",
});

export type Context = ReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
