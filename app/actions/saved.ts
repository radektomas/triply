"use server";

import { getServerSupabase } from "@/lib/supabase/server";
import { sendSavedDestinationEmail } from "@/lib/email/lifecycle";
import type { APIDestination, SavedTripContext } from "@/lib/types";

// Server path for saving a destination.
//
// The insert used to happen straight from the browser, and the confirmation
// email was driven by a Supabase Database Webhook on saved_destinations INSERT
// — the same trigger-plus-plaintext-secret arrangement as the welcome email.
// Doing the insert here lets the email be sent in-process, so the webhook and
// its secret can go.
//
// The write still runs through the COOKIE-BOUND client, not the service role:
// the "Users manage own saved destinations - insert" RLS policy
// (with check auth.uid() = user_id) stays in force, so this action cannot be
// used to write a row for anyone but the caller — even though user_id is taken
// from the session rather than the argument list, which already prevents it.
//
// Deleting a save stays on the browser client: it is equally RLS-protected and
// sends no email, so moving it would add a round trip for nothing.

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

  return { ok: true, rowId: data.id as string };
}
