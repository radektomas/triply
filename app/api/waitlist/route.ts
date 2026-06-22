import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Triply Plus waitlist lead capture. Persists to public.waitlist_emails via the
// service-role client (bypasses RLS; the table has RLS on with no public
// policies, so leads stay private). Duplicate emails are ignored (unique
// constraint + on-conflict-do-nothing) and still report success so we never
// leak whether an email was already on the list.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown; source?: unknown };
    const email = String(body.email ?? "").trim().slice(0, 200);
    const source = String(body.source ?? "").trim().slice(0, 60);

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    // Upsert with ignoreDuplicates → ON CONFLICT (email) DO NOTHING. A repeat
    // email is a no-op (no error, no row), and we still return success so the
    // response never reveals whether the email already existed.
    const { error } = await supabase
      .from("waitlist_emails")
      .upsert(
        { email, source: source || "triply_plus" },
        { onConflict: "email", ignoreDuplicates: true },
      );

    if (error) {
      console.error("[api/waitlist] insert failed:", error.message);
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/waitlist] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
