// Shared analytics event contract — imported by BOTH the browser tracker
// (lib/analytics.ts) and the server ingest route (app/api/analytics/event).
//
// It lives in its own module, free of "server-only" and of any Supabase
// import, precisely so the allow-list the client is typed against and the
// allow-list the server validates against can never drift apart.
//
// Why this exists at all: analytics_events used to carry an RLS policy of
// `for insert to anon, authenticated with check (true)`, so anyone holding the
// public anon key could write unlimited arbitrary rows straight into the
// funnel table — any event name, any properties, any session id, and a
// forged user_id. Writes now go through a server route that validates against
// this contract, and the public insert policy is dropped.

/** Every event the product is allowed to record. Anything else is rejected. */
export const ANALYTICS_EVENTS = [
  "landing_view",
  "trip_form_started",
  "trip_generated",
  "destination_chosen",
  "trip_detail_viewed",
  "affiliate_clicked",
  "account_created",
  "email_captured",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

const EVENT_SET: ReadonlySet<string> = new Set(ANALYTICS_EVENTS);

export function isAnalyticsEvent(name: unknown): name is AnalyticsEvent {
  return typeof name === "string" && EVENT_SET.has(name);
}

/** Session ids are UUIDs — see getSessionId() in lib/analytics.ts. */
export const SESSION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Bounds on the free-form properties bag. Generous next to real usage (the
// widest call today sends three keys) but tight enough that the table can't be
// used as free storage.
export const MAX_PROPERTY_KEYS = 12;
export const MAX_PROPERTY_KEY_LENGTH = 40;
export const MAX_STRING_VALUE_LENGTH = 200;
export const MAX_PROPERTIES_BYTES = 2048;

/** Scalars only — no nested objects or arrays. */
export type AnalyticsPropertyValue = string | number | boolean | null;

export type ValidationResult =
  | { ok: true; properties: Record<string, AnalyticsPropertyValue> }
  | { ok: false; reason: string };

/**
 * Validate and normalise a properties bag. Shared so the client can avoid
 * sending something the server will only reject.
 *
 * Deliberately strict rather than lenient: an oversized or wrongly-shaped bag
 * is rejected outright, not silently trimmed, so a bug in a caller surfaces
 * during development instead of quietly writing junk into the funnel.
 */
export function validateProperties(input: unknown): ValidationResult {
  if (input === undefined || input === null) return { ok: true, properties: {} };
  if (typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, reason: "properties must be a plain object" };
  }

  const entries = Object.entries(input as Record<string, unknown>);
  if (entries.length > MAX_PROPERTY_KEYS) {
    return { ok: false, reason: `too many properties (max ${MAX_PROPERTY_KEYS})` };
  }

  const out: Record<string, AnalyticsPropertyValue> = {};
  for (const [key, value] of entries) {
    if (key.length > MAX_PROPERTY_KEY_LENGTH) {
      return { ok: false, reason: `property key too long: ${key.slice(0, 20)}…` };
    }
    if (value === null) {
      out[key] = null;
    } else if (typeof value === "string") {
      if (value.length > MAX_STRING_VALUE_LENGTH) {
        return { ok: false, reason: `property "${key}" exceeds ${MAX_STRING_VALUE_LENGTH} chars` };
      }
      out[key] = value;
    } else if (typeof value === "number") {
      // NaN/Infinity are not representable in JSON and would land as null.
      if (!Number.isFinite(value)) {
        return { ok: false, reason: `property "${key}" must be a finite number` };
      }
      out[key] = value;
    } else if (typeof value === "boolean") {
      out[key] = value;
    } else {
      return {
        ok: false,
        reason: `property "${key}" must be a string, number, boolean or null`,
      };
    }
  }

  if (JSON.stringify(out).length > MAX_PROPERTIES_BYTES) {
    return { ok: false, reason: `properties exceed ${MAX_PROPERTIES_BYTES} bytes` };
  }
  return { ok: true, properties: out };
}
