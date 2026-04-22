import { prisma } from "@wowcut/db";
import type { PrismaClient } from "@wowcut/db";

export type Surface = "client-portal" | "operator";

export interface ContextSession {
  surface: Surface;
  actorId: string | null;
  actorEmail: string | null;
  clientId: string | null;
  role: "client" | "operator" | "admin" | "public";
}

export interface Context {
  prisma: PrismaClient;
  session: ContextSession;
}

export async function createContext(opts: {
  surface: Surface;
  session: Partial<ContextSession>;
}): Promise<Context> {
  return {
    prisma,
    session: {
      surface: opts.surface,
      actorId: opts.session.actorId ?? null,
      actorEmail: opts.session.actorEmail ?? null,
      clientId: opts.session.clientId ?? null,
      role: opts.session.role ?? "public",
    },
  };
}

export type ServerContext = Awaited<ReturnType<typeof createContext>>;
