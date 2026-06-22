import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";

// Daily limit for logged-in users. 1 generation = 1 result set (the first
// search counts too). Named constant so the cap is trivial to change.
export const DAILY_GENERATION_LIMIT = 3;

type ServerClient = Awaited<ReturnType<typeof getServerSupabase>>;

export interface GenerationLimitStatus {
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
  /**
   * No logged-in user. Anonymous quota (1/day) is tracked client-side in
   * localStorage and enforced in the UI phase — the backend deliberately does
   * NOT gate anon here. This flag is the clean seam for that later work.
   */
  anonymous: boolean;
}

/** UTC calendar day as YYYY-MM-DD — matches the `date` column and resets at
 *  UTC midnight regardless of server/user timezone. */
function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

// Anonymous: not gated by the backend (yet). Reported as a clean seam so the
// UI phase can take over with the localStorage-based 1/day rule.
const ANON_STATUS: GenerationLimitStatus = {
  allowed: true,
  used: 0,
  remaining: DAILY_GENERATION_LIMIT,
  limit: DAILY_GENERATION_LIMIT,
  anonymous: true,
};

/**
 * Read the logged-in user's daily generation status, lazily rolling over the
 * count at UTC midnight. If the stored reset date is missing or older than
 * today, the count is reset to 0 and the reset date is advanced to today.
 *
 * Pass an existing cookie-bound client to avoid re-creating one; otherwise one
 * is created via getServerSupabase(). Fails OPEN (allowed) on any read error so
 * a transient DB issue never blocks generation — this helper is for reporting,
 * not hard enforcement (enforcement is a later phase).
 */
export async function checkGenerationLimit(
  client?: ServerClient,
): Promise<GenerationLimitStatus> {
  const supabase = client ?? (await getServerSupabase());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return ANON_STATUS;

  const today = utcToday();
  const { data, error } = await supabase
    .from("profiles")
    .select("generations_today, generations_reset_date")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    // No profile row yet, or a read error — treat as a fresh day, don't block.
    return {
      allowed: true,
      used: 0,
      remaining: DAILY_GENERATION_LIMIT,
      limit: DAILY_GENERATION_LIMIT,
      anonymous: false,
    };
  }

  const resetDate = (data.generations_reset_date as string | null) ?? null;
  const isNewDay = resetDate === null || resetDate < today;
  let used = isNewDay ? 0 : data.generations_today ?? 0;

  if (isNewDay) {
    const { error: resetErr } = await supabase
      .from("profiles")
      .update({ generations_today: 0, generations_reset_date: today })
      .eq("id", user.id);
    if (resetErr) {
      console.warn("[generationLimits] day reset failed:", resetErr.message);
    }
    used = 0;
  }

  return {
    allowed: used < DAILY_GENERATION_LIMIT,
    used,
    remaining: Math.max(0, DAILY_GENERATION_LIMIT - used),
    limit: DAILY_GENERATION_LIMIT,
    anonymous: false,
  };
}

/**
 * Increment the logged-in user's daily generation count by 1. Call this only
 * when a generation actually SUCCEEDED. No-op for anonymous users (their quota
 * is handled in the UI phase). Rollover-safe on its own: if the stored reset
 * date isn't today, the count restarts at 1 for the new UTC day.
 *
 * Read-modify-write at the JS layer (matches the project's existing Supabase
 * helper style). The tiny race between two simultaneous generations is
 * acceptable for a 3/day cap; harden with a Postgres function later if needed.
 */
export async function incrementGenerationCount(
  client?: ServerClient,
): Promise<void> {
  const supabase = client ?? (await getServerSupabase());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const today = utcToday();
  const { data } = await supabase
    .from("profiles")
    .select("generations_today, generations_reset_date")
    .eq("id", user.id)
    .maybeSingle();

  const resetDate = (data?.generations_reset_date as string | null) ?? null;
  const sameDay = resetDate === today;
  const base = sameDay ? data?.generations_today ?? 0 : 0;

  const { error } = await supabase
    .from("profiles")
    .update({ generations_today: base + 1, generations_reset_date: today })
    .eq("id", user.id);
  if (error) {
    console.warn("[generationLimits] increment failed:", error.message);
  }
}
