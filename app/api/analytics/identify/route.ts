import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { supabase as serviceSupabase } from "@/lib/supabase";

// Identity backfill for product analytics. When a user signs up, their
// anonymous pre-signup events (logged with a session_id but no user_id) get
// attached to the new account so the activation funnel can follow a single
// person from landing_view through account_created.
//
// The user id is read from the verified auth cookie server-side (never trusted
// from the client). The session id is client-supplied — it only scopes which
// anonymous rows to claim. The UPDATE runs through the service-role client
// because analytics_events has no public update policy (insert-only RLS).
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { sessionId?: unknown };
    const sessionId = String(body.sessionId ?? "").trim();
    if (!sessionId) {
      return NextResponse.json({ error: "missing_session_id" }, { status: 400 });
    }

    const sb = await getServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { error } = await serviceSupabase
      .from("analytics_events")
      .update({ user_id: user.id })
      .eq("session_id", sessionId)
      .is("user_id", null);

    if (error) {
      console.error("[api/analytics/identify] backfill failed:", error.message);
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/analytics/identify] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
