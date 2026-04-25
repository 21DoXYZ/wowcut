import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { aiconRouter } from "@/server/root";
import { createContext } from "@/server/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: aiconRouter,
    createContext,
  });

export { handler as GET, handler as POST };
