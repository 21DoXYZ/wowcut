import { router } from "../trpc";
import { operatorClientsRouter } from "./operator-clients";
import { operatorQcRouter } from "./operator-qc";
import { operatorTrendsRouter } from "./operator-trends";
import { operatorMetricsRouter } from "./operator-metrics";
import { operatorDeliveryRouter } from "./operator-delivery";
import { operatorPlanRouter } from "./operator-plan";
import { operatorQueueRouter } from "./operator-queue";
import { operatorLibraryRouter } from "./operator-library";
import { supportRouter } from "./support";

export const operatorRouter = router({
  clients: operatorClientsRouter,
  qc: operatorQcRouter,
  trends: operatorTrendsRouter,
  metrics: operatorMetricsRouter,
  delivery: operatorDeliveryRouter,
  plan: operatorPlanRouter,
  queue: operatorQueueRouter,
  library: operatorLibraryRouter,
  support: supportRouter,
});

export type OperatorRouter = typeof operatorRouter;
