import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { sendWelcomeOnce } from "@/lib/email/lifecycle";

// Welcome email for the one signup path that never reaches /auth/callback.
//
// Three ways an account gets created:
//   1. Google OAuth              → /auth/callback (?code=)      → handled there
//   2. Email signup + confirmation → /auth/callback (token_hash) → handled there
//   3. Email signup with NO confirmation required → Supabase returns a session
//      immediately and the browser never visits the callback. That is this
//      route. Without it, path 3 silently gets no welcome email.
//
// Takes no parameters: the user is read from the verified auth cookie, so a
// caller can only ever trigger their own welcome. sendWelcomeOnce is guarded by
// profiles.welcome_sent_at, so calling this repeatedly — or calling it for an
// account that already went through the callback — cannot produce a second
// email.

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const outcome = await sendWelcomeOnce(user.id);
    if (outcome === "send_failed") {
      console.error("[api/auth/welcome] send failed for", user.id);
      // 200 regardless: the caller is fire-and-forget and must not retry, and
      // the send is already stamped as claimed so a retry would no-op anyway.
    }
    return NextResponse.json({ outcome });
  } catch (err) {
    console.error("[api/auth/welcome] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
