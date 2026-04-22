import { createTRPCReact } from "@trpc/react-query";
import type { OperatorRouter } from "@wowcut/api/routers/operator";

export const trpc = createTRPCReact<OperatorRouter>();
