import { createTRPCReact } from "@trpc/react-query";
import type { ClientPortalRouter } from "@wowcut/api/routers/client-portal";

export const trpc = createTRPCReact<ClientPortalRouter>();
