"use server";

import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { supabase as admin } from "@/lib/supabase";

// Account deletion (GDPR Art. 17, "right to erasure").
//
// Identity comes from the caller's own session — the action deletes whoever is
// signed in and nothing else, so there is no id parameter to tamper with.
// The actual removal runs on the SERVICE-ROLE client: dropping the auth user
// requires admin rights, and the per-table deletes must not depend on RLS
// policies being present (profiles, for one, has no DELETE policy).
//
// Order matters. analytics_events.user_id is `references auth.users(id) on
// delete set null`, so deleting the auth user FIRST would silently orphan
// those rows as anonymous data instead of erasing them. Every user-linked
// table is therefore cleared before the auth record goes.
//
// The shared `trips` cache is intentionally untouched: those rows carry no
// user_id and no identifier of any kind (only normalized form input + the AI
// result), they are shared across users by cache key, and they age out via
// /api/cron/retention. Deleting them on one user's request would degrade the
// service for everyone with no privacy benefit.

/** Tables holding rows keyed to a user, cleared in FK-safe order. */
const USER_SCOPED_TABLES = [
  "analytics_events",
  "generation_history",
  "saved_destinations",
] as const;

export type DeleteAccountResult = { error: string };

export async function deleteAccount(): Promise<DeleteAccountResult | void> {
  const userClient = await getServerSupabase();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to delete your account." };
  }
  const userId = user.id;

  for (const table of USER_SCOPED_TABLES) {
    const { error } = await admin.from(table).delete().eq("user_id", userId);
    if (error) {
      console.error(`[profile/deleteAccount] ${table} delete failed:`, error.message);
      // Abort rather than continue: a partial deletion that still reports
      // success would leave personal data behind while telling the user it is
      // gone. Nothing has been irreversibly lost yet — the auth user is intact,
      // so the user can retry.
      return {
        error:
          "We couldn't finish deleting your data. Nothing was removed — please try again, or email hello@flytriply.eu.",
      };
    }
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId);
  if (profileErr) {
    console.error("[profile/deleteAccount] profiles delete failed:", profileErr.message);
    return {
      error:
        "We couldn't finish deleting your account. Please try again, or email hello@flytriply.eu.",
    };
  }

  const { error: authErr } = await admin.auth.admin.deleteUser(userId);
  if (authErr) {
    // Data is already gone; only the login record survives. Log loudly — this
    // needs manual cleanup — but don't tell the user their data is intact,
    // because it isn't.
    console.error(
      "[profile/deleteAccount] auth user delete failed (data already removed):",
      authErr.message,
    );
    return {
      error:
        "Your data was removed, but we couldn't close the login itself. Please email hello@flytriply.eu so we can finish up.",
    };
  }

  // scope: "local" clears the session cookies without calling the auth server —
  // the user it would authenticate against no longer exists, so a network
  // sign-out would fail and leave stale cookies behind.
  await userClient.auth.signOut({ scope: "local" });

  redirect("/?deleted=1");
}
