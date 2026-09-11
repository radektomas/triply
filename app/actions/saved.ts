"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { sendSavedDestinationEmail } from "@/lib/email/lifecycle";
import type { APIDestination, SavedTripContext } from "@/lib/types";

// Server path for the watchlist (= saved destinations).
//
// Saving a place is the same wish as "tell me when it gets cheap", so every
// save lands on the user's watchlist with deal alerts on; `setDealAlerts`
// mutes/unmutes per place and `unsaveDestination` removes it.
//
// The insert used to happen straight from the browser, and the confirmation
// email was driven by a Supabase Database Webhook on saved_destinations INSERT
// — the same trigger-plus-plaintext-secret arrangement as the welcome email.
// Doing the insert here lets the email be sent in-process, so the webhook and
// its secret can go.
//
// Every write runs through the COOKIE-BOUND client, not the service role: the
// "Users manage own saved destinations - *" RLS policies stay in force, so
// none of these can touch a row that isn't the caller's — even though user_id
// is taken from the session rather than the argument list, which already
// prevents it.

export type SaveResult =
  | { ok: true; rowId: string }
  | { ok: false; error: "unauthorized" | "save_failed" };

export async function saveDestination(input: {
  destination: APIDestination;
  context?: SavedTripContext;
}): Promise<SaveResult> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // Trip context is embedded in the destination jsonb so the profile page can
  // deep-link back to the originating trip — unchanged from the client version.
  const payload = input.context
    ? { ...input.destination, __context: input.context }
    : input.destination;

  const { data, error } = await supabase
    .from("saved_destinations")
    .insert({ user_id: user.id, destination: payload })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[actions/saved] insert failed:", error?.message);
    return { ok: false, error: "save_failed" };
  }

  // Confirmation email. Awaited rather than deferred: a Server Action's
  // response is the end of the request, so there is no post-response seam to
  // hand it to. sendSavedDestinationEmail never throws, so a mail failure
  // cannot turn a successful save into a failed one.
  await sendSavedDestinationEmail({
    userId: user.id,
    destinationName: String(input.destination.name ?? "").trim(),
  });

  revalidatePath("/profile");
  return { ok: true, rowId: data.id as string };
}

export type PlainResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f-]{36}$/i;

export async function unsaveDestination(rowId: string): Promise<PlainResult> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };
  if (!UUID.test(rowId)) return { ok: false, error: "Bad id." };

  const { error } = await supabase
    .from("saved_destinations")
    .delete()
    .eq("id", rowId)
    .eq("user_id", user.id);
  if (error) {
    console.error("[actions/saved] delete failed:", error.message);
    return { ok: false, error: "Couldn't remove that place." };
  }
  revalidatePath("/profile");
  return { ok: true };
}

/** Mute / unmute deal alerts for one saved place. */
export async function setDealAlerts(rowId: string, on: boolean): Promise<PlainResult> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };
  if (!UUID.test(rowId)) return { ok: false, error: "Bad id." };

  const { error } = await supabase
    .from("saved_destinations")
    .update({ deal_alerts: on })
    .eq("id", rowId)
    .eq("user_id", user.id);
  if (error) {
    console.error("[actions/saved] alerts update failed:", error.message);
    return { ok: false, error: "Couldn't change alerts for that place." };
  }
  revalidatePath("/profile");
  return { ok: true };
}
