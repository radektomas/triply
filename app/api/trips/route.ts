import { NextRequest, NextResponse, after } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  fetchTripSuggestions,
  buildCacheKey,
  UpstreamUnavailableError,
} from "@/lib/n8n";
import { computeNights } from "@/lib/dates";
import { warmCityPhotoCache } from "@/lib/photos";
import { incrementGenerationCount } from "@/lib/generationLimits";
import type { TripInput } from "@/lib/types";

// Discriminated error stages. The client (TripForm) branches on `stage` to
// decide whether to show an inline message (validation) or the full-screen
// ErrorOverlay (upstream_*), and to compose the user-facing copy. Keep
// stages in sync with TripForm's stage handler.
type FailureStage =
  | "validation"
  | "upstream_unreachable"
  | "upstream_error"
  | "upstream_timeout"
  | "parse"
  | "internal";

interface FailureBody {
  error: string;
  stage: FailureStage;
  status: number;
  /** Free-form server-side context — safe for the user to see, never sensitive. */
  detail?: string;
  /** Upstream HTTP status when stage === "upstream_error". */
  upstreamStatus?: number;
}

function failure(
  body: FailureBody,
  init?: { headers?: Record<string, string> },
): NextResponse {
  return NextResponse.json(body, {
    status: body.status,
    headers: init?.headers,
  });
}

const ALLOWED_VIBES = [
  "beach",
  "city",
  "mountains",
  "party",
  "culture",
  "adventure",
  "relax",
  "nature",
  "food",
  "romantic",
  "hiking",
  "wine",
  "spa",
  "luxury",
  "budget",
  "history",
  "art",
  "nightlife",
  "diving",
];

function normalizeInput(raw: Record<string, unknown>): TripInput {
  // Per-person, in EUR. Keep [100, 2000] in sync with the TripForm budget
  // control (components/landing/TripForm.tsx BUDGET_MIN/BUDGET_MAX) so the
  // server enforces the same envelope the UI advertises.
  const budget = Math.min(Math.max(Number(raw.budget) || 500, 100), 2000);
  const travelers = Math.min(
    Math.max(Math.round(Number(raw.travelers) || 1), 1),
    10,
  );
  const originCity = String(raw.originCity ?? "Prague")
    .slice(0, 50)
    .replace(/[^\w\s,\-.]/g, "")
    .trim();
  const vibeRaw = String(raw.vibe ?? "").toLowerCase().trim();
  const vibe = ALLOWED_VIBES.includes(vibeRaw) ? vibeRaw : "city";

  // Three explicit modes — `region` and `exact_city` carry a destinationInput;
  // `surprise` doesn't. Legacy `specific` (the old unified value) always
  // resolved to a single result, so it's normalized to `exact_city`. The last
  // in-app emitter of wire `specific` (CustomCityPicker) has been removed and no
  // current client sends it; the alias is kept purely for back-compat with any
  // in-flight requests / bookmarked calls still using the old value.
  const rawMode = String(raw.destinationMode ?? "surprise");
  const requestedMode: "surprise" | "region" | "exact_city" =
    rawMode === "region"
      ? "region"
      : rawMode === "exact_city" || rawMode === "specific"
        ? "exact_city"
        : "surprise";
  const destinationInputRaw = String(raw.destinationInput ?? "")
    .slice(0, 80)
    .replace(/[^\p{L}\p{N}\s,\-.']/gu, "")
    .trim();
  // `region`/`exact_city` carry a destinationInput. If the input is
  // missing/too short we fall back to surprise mode.
  const destinationInput =
    requestedMode !== "surprise" && destinationInputRaw.length >= 2
      ? destinationInputRaw
      : undefined;
  const destinationMode: "surprise" | "region" | "exact_city" =
    destinationInput ? requestedMode : "surprise";

  return {
    budget,
    checkIn: String(raw.checkIn ?? "").trim(),
    checkOut: String(raw.checkOut ?? "").trim(),
    travelers,
    vibe,
    originCity,
    destinationMode,
    destinationInput,
  };
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const tag = (label: string, since: number) =>
    `[api/trips] +${(Date.now() - since).toString().padStart(5)}ms ${label}`;
  let input: TripInput;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    input = normalizeInput(body);
  } catch (err) {
    console.error("[/api/trips] Request parse failed:", err);
    return failure({
      error: "invalid_request_body",
      stage: "parse",
      status: 400,
      detail: err instanceof Error ? err.message : "Could not parse request body.",
    });
  }

  try {
    if (!input.checkIn || !input.checkOut || !input.originCity) {
      return failure({
        error: "missing_fields",
        stage: "validation",
        status: 400,
        detail: "Missing required fields: check-in, check-out, or origin city.",
      });
    }

    if (computeNights(input.checkIn, input.checkOut) < 1) {
      return failure({
        error: "invalid_dates",
        stage: "validation",
        status: 400,
        detail: "Check-out must be after check-in.",
      });
    }

    const cacheKey = buildCacheKey(input);

    // n8n owns trip-generation caching (its workflow has Check Cache / Save
    // to Cache nodes against trip_cache). We just call the webhook — it
    // returns either a cached or a freshly generated result.
    const tN8n = Date.now();
    // TEMP DIAGNOSTIC — remove once n8n call confirmed healthy.
    // Logs the resolved webhook URL host+path (no query/secret) and the
    // outcome of the upstream call so failures are visible in the dev
    // server terminal even when the browser overlay swallows the body.
    {
      const rawUrl = process.env.N8N_WEBHOOK_URL ?? "";
      let safeUrl = rawUrl;
      try {
        const u = new URL(rawUrl);
        safeUrl = `${u.origin}${u.pathname}`;
      } catch {
        safeUrl = "(unparseable URL)";
      }
      console.log("[trips route] calling n8n:", safeUrl);
    }
    let result;
    try {
      result = await fetchTripSuggestions(input);
      console.log("[trips route] n8n responded: ok");
    } catch (n8nErr) {
      const name = n8nErr instanceof Error ? n8nErr.name : typeof n8nErr;
      const message = n8nErr instanceof Error ? n8nErr.message : String(n8nErr);
      const kind =
        n8nErr instanceof UpstreamUnavailableError ? n8nErr.kind : undefined;
      const upstreamStatus =
        n8nErr instanceof UpstreamUnavailableError ? n8nErr.status : undefined;
      console.error("[trips route] n8n fetch threw:", {
        name,
        kind,
        upstreamStatus,
        message,
      });
      throw n8nErr;
    }
    console.log(tag("n8n response", tN8n));

    // Create a new trips row — unique UUID per user session
    const tInsert = Date.now();
    const { data: trip, error } = await supabase
      .from("trips")
      .insert({ input, result, cache_key: cacheKey })
      .select("id")
      .single();
    console.log(tag("trips insert", tInsert));

    if (error || !trip) {
      console.error("[/api/trips] Supabase insert failed:", error);
      return failure({
        error: "trip_persist_failed",
        stage: "internal",
        status: 500,
        detail: error?.message ?? "Could not save the generated trip.",
      });
    }

    // If the request is from a signed-in user, append this generation to
    // their personal history. Deferred via after() so it runs AFTER the
    // response is sent — it never adds to TTFB, and the response doesn't
    // depend on it. Uses the cookie-bound server client so the row is
    // written under the user's identity (RLS-friendly).
    after(async () => {
      try {
        const userClient = await getServerSupabase();
        const {
          data: { user },
        } = await userClient.auth.getUser();
        if (user) {
          const { error: histErr } = await userClient
            .from("generation_history")
            .insert({
              user_id: user.id,
              trip: {
                tripId: trip.id,
                input,
                destinations: result.destinations ?? [],
                searchSummary: result.searchSummary ?? null,
              },
            });
          if (histErr) {
            console.warn("[/api/trips] generation_history insert failed:", histErr.message);
          }

          // Count this successful generation against the user's daily limit.
          // Runs in the same success-only after() seam (failed/errored
          // generations return before after() is registered), so only real
          // result sets increment. Reuses the cookie-bound client for RLS.
          await incrementGenerationCount(userClient);
        }
      } catch (histErr) {
        console.warn("[/api/trips] generation_history write skipped:", histErr);
      }
    });

    // Pre-warm the shared photo cache for every returned destination so the
    // results grid / detail page render from cache instead of a live Pexels
    // fetch. Critical for region trips: their niche towns are usually cache-cold
    // (famous surprise/exact cities are already warm from prior traffic), so a
    // failed live fetch on prod would otherwise drop them to the gradient
    // fallback. Fire-and-forget via after() — runs post-response, never blocks
    // TTFB; getCityPhotos no-ops on a cache hit so warm cities stay cheap, and
    // warmCityPhotoCache bounds concurrency + swallows per-city failures.
    const warmTargets = (result.destinations ?? []).map((d) => ({
      name: d.name,
      country: d.country,
    }));
    if (warmTargets.length > 0) {
      after(() => warmCityPhotoCache(warmTargets));
    }

    // Surface the destinations count + first slug so the caller can branch:
    //   count === 1 → deep-link to /trip/<id>?d=<slug> (detail page)
    //   count >  1 → go to /trip/<id>            (results grid / selector)
    // A `specific` query for a region (e.g. "Sardinia") can legitimately
    // return multiple destinations; the count tells callers which.
    const destinationCount = result.destinations?.length ?? 0;
    const firstDestinationId = result.destinations?.[0]?.id ?? null;
    console.log(tag("total", t0));
    return NextResponse.json({
      tripId: trip.id,
      firstDestinationId,
      destinationCount,
    });
  } catch (err: unknown) {
    if (err instanceof UpstreamUnavailableError) {
      // 504 for timeout (semantically "we timed out waiting on upstream"),
      // 503 for unreachable / non-2xx ("upstream not currently available").
      // Both carry Retry-After so well-behaved clients back off.
      const stage: FailureStage =
        err.kind === "timeout"
          ? "upstream_timeout"
          : err.kind === "error"
            ? "upstream_error"
            : "upstream_unreachable";
      const status = err.kind === "timeout" ? 504 : 503;
      console.error("[/api/trips] Upstream failure:", {
        stage,
        message: err.message,
        upstreamStatus: err.status,
      });
      return failure(
        {
          error: stage,
          stage,
          status,
          detail: err.message,
          upstreamStatus: err.status,
        },
        { headers: { "Retry-After": "30" } },
      );
    }
    console.error("[/api/trips] Failed:", err);
    return failure({
      error: "internal_error",
      stage: "internal",
      status: 500,
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
