import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { operatorRouter, createContext } from "@wowcut/api/server";
import { cookies } from "next/headers";

const handler = async (req: Request) => {
  const session = cookies().get("ops_session")?.value;
  const secret = process.env.OPERATOR_SECRET;

  // Valid session → admin (single-operator tool, no role tiers needed)
  // No OPERATOR_SECRET set → dev mode, grant admin (session cookie = "dev")
  const authenticated = !secret || session === secret || session === "dev";

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: operatorRouter,
    createContext: () =>
      createContext({
        surface: "operator",
        session: { role: authenticated ? "admin" : "public" },
      }),
  });
};

export { handler as GET, handler as POST };
