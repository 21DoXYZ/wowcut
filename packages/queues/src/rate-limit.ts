import { getRedis } from "./index";

/**
 * Fixed-window rate limiter backed by Redis INCR + EXPIRE.
 *
 *   const r = await checkRateLimit({ bucket: "aicon-create", key: ipHash, limit: 5, windowSec: 3600 });
 *   if (!r.ok) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: r.message });
 *
 * Returns the current count and whether the request is allowed. The window
 * resets atomically when the key expires, which is good enough for protecting
 * against accidental loops or scripted abuse — not for fighting determined
 * adversaries (use a sliding window + auth for that).
 */
export interface RateLimitInput {
  /** Logical bucket name (groups counters together for the same kind of action). */
  bucket: string;
  /** Caller identity — IP hash, user id, etc. */
  key: string;
  /** Maximum allowed events in the window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
}

export interface RateLimitResult {
  ok: boolean;
  count: number;
  remaining: number;
  resetSec: number;
  message?: string;
}

export async function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  const redis = getRedis();
  const k = `rl:${input.bucket}:${input.key}`;
  const count = await redis.incr(k);
  if (count === 1) {
    await redis.expire(k, input.windowSec);
  }
  const ttl = await redis.ttl(k);
  const ok = count <= input.limit;
  return {
    ok,
    count,
    remaining: Math.max(0, input.limit - count),
    resetSec: ttl > 0 ? ttl : input.windowSec,
    message: ok
      ? undefined
      : `Rate limit reached (${input.limit}/${input.windowSec}s). Try again in ${Math.ceil(ttl / 60)} min.`,
  };
}
