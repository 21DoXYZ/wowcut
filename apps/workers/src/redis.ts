// Re-export shared Redis connection so workers share it with the api.
export { getRedis as getRedisConnection } from "@wowcut/queues";
import { getRedis } from "@wowcut/queues";
export const redis = getRedis();
