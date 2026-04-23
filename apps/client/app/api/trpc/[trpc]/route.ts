import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { clientPortalRouter, createContext } from "@wowcut/api/server";
import { getCurrentClient } from "@/lib/session";

const handler = async (req: Request) => {
  const current = await getCurrentClient().catch(() => null);
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: clientPortalRouter,
    createContext: () =>
      createContext({
        surface: "client-portal",
        session: {
          actorEmail: current?.email ?? null,
          clientId: current?.clientId ?? null,
          role: current ? "client" : "public",
        },
      }),
  });
};

export { handler as GET, handler as POST };
