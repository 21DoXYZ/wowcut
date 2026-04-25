import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { aiconRouter } from "@/server/root";
import { createContext } from "@/server/trpc";

// Force Node.js runtime — we use Buffer, prisma client, BullMQ producers.
export const runtime = "nodejs";
export const maxDuration = 60;

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: aiconRouter,
    createContext,
  });

export { handler as GET, handler as POST };
