import { router } from "../trpc";
import { operatorClientsRouter } from "./operator-clients";
import { operatorQcRouter } from "./operator-qc";
import { operatorTrendsRouter } from "./operator-trends";
import { operatorMetricsRouter } from "./operator-metrics";
import { supportRouter } from "./support";

export const operatorRouter = router({
  clients: operatorClientsRouter,
  qc: operatorQcRouter,
  trends: operatorTrendsRouter,
  metrics: operatorMetricsRouter,
  support: supportRouter,
});

export type OperatorRouter = typeof operatorRouter;
