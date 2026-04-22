import { router } from "../trpc";
import { previewRouter } from "./preview";
import { onboardingRouter } from "./onboarding";
import { deliveryRouter } from "./delivery";
import { libraryRouter } from "./library";
import { insightsRouter } from "./insights";
import { calendarRouter } from "./calendar";
import { supportRouter } from "./support";
import { briefRouter } from "./brief";
import { subscriptionRouter } from "./subscription";

export const clientPortalRouter = router({
  preview: previewRouter,
  onboarding: onboardingRouter,
  delivery: deliveryRouter,
  library: libraryRouter,
  insights: insightsRouter,
  calendar: calendarRouter,
  support: supportRouter,
  brief: briefRouter,
  subscription: subscriptionRouter,
});

export type ClientPortalRouter = typeof clientPortalRouter;
