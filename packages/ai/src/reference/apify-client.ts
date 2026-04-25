/**
 * Thin wrapper over the Apify HTTP API.
 *
 * Uses run-sync-get-dataset-items so we get the scraped result back in a single
 * round trip — Apify boots the actor, waits for it to finish, and returns the
 * dataset rows inline. Good for our use case where we scrape one URL at a time.
 *
 * Auth via APIFY_API_TOKEN env var. Errors throw with status + body.
 */

const APIFY_BASE = "https://api.apify.com/v2";

function getToken(): string {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN not set");
  return token;
}

export interface ApifyRunOptions {
  /** actor id, e.g. "apify/instagram-scraper" or "clockworks~free-tiktok-scraper" */
  actor: string;
  /** input payload for the actor */
  input: Record<string, unknown>;
  /** maximum seconds to wait for the run (Apify caps at 300s for sync calls) */
  timeoutSecs?: number;
}

export async function runActorSync<T = unknown>(opts: ApifyRunOptions): Promise<T[]> {
  const token = getToken();
  // Apify accepts both `user/actor` and `user~actor` in the URL; normalise to `~`.
  const actorPath = opts.actor.replace("/", "~");
  const url = `${APIFY_BASE}/acts/${actorPath}/run-sync-get-dataset-items?token=${token}&timeout=${opts.timeoutSecs ?? 300}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(opts.input),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const detail = body.slice(0, 300);
    if (res.status === 401) {
      throw new Error(`Apify auth failed (401) — check APIFY_API_TOKEN. ${detail}`);
    }
    if (res.status === 402) {
      throw new Error(`Apify out of credits (402). ${detail}`);
    }
    if (res.status === 404) {
      throw new Error(`Apify actor "${opts.actor}" not found (404). ${detail}`);
    }
    if (res.status >= 500) {
      throw new Error(`Apify upstream error ${res.status}. ${detail}`);
    }
    throw new Error(`Apify ${opts.actor} ${res.status}: ${detail}`);
  }

  const items = (await res.json()) as T[];
  if (!Array.isArray(items)) {
    throw new Error(`Apify ${opts.actor} returned non-array response`);
  }
  return items;
}
