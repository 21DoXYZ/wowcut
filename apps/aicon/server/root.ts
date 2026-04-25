import { router } from "./trpc";
import { videoProjectRouter } from "./routers/video-project";

export const aiconRouter = router({
  project: videoProjectRouter,
});

export type AiconRouter = typeof aiconRouter;
