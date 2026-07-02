// In-flight deduplication for trip generations.
//
// Concurrent duplicate requests (double-taps that slip past the client lock,
// multiple tabs, retries) used to each start their own n8n generation — n8n
// OOMs under such bursts. This module keys every generation by the SAME
// normalized cache key n8n caches on (lib/n8n.ts buildCacheKey), so a
// duplicate request rides along on the already-running generation's promise
// instead of starting a second n8n call, plus a hard cap on total concurrent
// generations as a backstop.
//
// NOTE: single-instance in-memory state. Like the proxy.ts rate-limit Map,
// this does NOT dedupe across serverless instances — fine for the current
// single-region Vercel + n8n cloud setup; would need a shared store
// (Redis/Upstash) if scaled to multiple regions/instances later.

// Hard cap on simultaneous DISTINCT generations (riders on an existing key
// don't count — they don't add n8n load). Sized to what the n8n instance
// handles comfortably; tune here.
const MAX_CONCURRENT = 6;

const inFlight = new Map<string, Promise<unknown>>();

/** Thrown instead of starting a new generation when MAX_CONCURRENT distinct
 *  generations are already running. Callers map this to HTTP 429. */
export class TooBusyError extends Error {
  code = "TOO_BUSY" as const;
  constructor() {
    super("Too many concurrent generations in flight");
    this.name = "TooBusyError";
  }
}

/**
 * Run `producerFn` deduplicated by `key`:
 *  - If a generation for `key` is already in flight, await THAT promise and
 *    return its result — no second n8n call. (A shared failure rejects all
 *    riders identically; they surface the same upstream error.)
 *  - Otherwise start `producerFn()`, register its promise under `key`, and
 *    always deregister in `finally` (resolve or reject).
 *  - Starting a NEW generation beyond MAX_CONCURRENT throws TooBusyError
 *    BEFORE producerFn is invoked — the expensive call never happens.
 */
export async function dedupeInFlight<T>(
  key: string,
  producerFn: () => Promise<T>,
): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  if (inFlight.size >= MAX_CONCURRENT) {
    throw new TooBusyError();
  }

  const promise = (async () => producerFn())().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}
