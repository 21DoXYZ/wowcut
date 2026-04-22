import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { operatorRouter, createContext } from "@wowcut/api/server";
import { auth } from "@clerk/nextjs/server";

const handler = async (req: Request) => {
  const { userId, sessionClaims } = auth();
  const role = ((sessionClaims?.metadata as { role?: string } | undefined)?.role as
    | "admin"
    | "operator"
    | undefined) ?? (userId ? "operator" : "public");

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: operatorRouter,
    createContext: () =>
      createContext({
        surface: "operator",
        session: {
          actorId: userId,
          role,
        },
      }),
  });
};

export { handler as GET, handler as POST };
