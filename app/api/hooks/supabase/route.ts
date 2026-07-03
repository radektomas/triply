import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendTemplateEmail } from "@/lib/email/send";

// Supabase Database Webhook adapter for the INSTANT lifecycle emails:
//   - profiles INSERT            -> "welcome"            (once, welcome_sent_at)
//   - saved_destinations INSERT  -> "saved_destination"  (every save)
//
// Configure two Database Webhooks in Supabase pointing here, both with the
// x-triply-secret header (same TRIPLY_EMAIL_SECRET as /api/email). Payload
// shape: { type, table, record, old_record }.
//
// Design rules: idempotent against duplicate fires (welcome_sent_at is checked
// before sending and stamped after), and a missing profile/email is a
// structured SKIP, never an unhandled 500 — we return 200 for skips so
// Supabase doesn't retry-loop on rows we'll never be able to email.

interface WebhookPayload {
  type?: string;
  table?: string;
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.TRIPLY_EMAIL_SECRET;
  if (!secret) {
    console.error("[hooks/supabase] missing env: TRIPLY_EMAIL_SECRET");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  if (req.headers.get("x-triply-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 });
  }

  const { type, table, record } = payload;

  try {
    // ── profiles INSERT → welcome (once) ─────────────────────────────────────
    if (table === "profiles" && type === "INSERT") {
      const id = str(record?.id);
      const email = str(record?.email);
      if (!email || !id) {
        return NextResponse.json({ skipped: "no_email_or_id", table });
      }
      if (record?.welcome_sent_at) {
        return NextResponse.json({ skipped: "welcome_already_sent", table });
      }

      const result = await sendTemplateEmail({
        template: "welcome",
        to: email,
        data: { name: str(record?.display_name) ?? "there" },
      });
      if (!result.ok) {
        console.error("[hooks/supabase] welcome send failed:", result);
        // Non-2xx so Supabase retries; welcome_sent_at is still NULL, so the
        // retry passes the idempotency check and tries again.
        return NextResponse.json(
          { error: result.error, detail: result.detail },
          { status: 502 },
        );
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ welcome_sent_at: new Date().toISOString() })
        .eq("id", id)
        .is("welcome_sent_at", null);
      if (updateErr) {
        // Email went out but the stamp failed — log loudly; a duplicate fire
        // could double-send until the stamp lands.
        console.error(
          "[hooks/supabase] welcome_sent_at stamp failed:",
          updateErr.message,
        );
      }
      return NextResponse.json({ sent: "welcome", id: result.id, to: email });
    }

    // ── saved_destinations INSERT → saved_destination ────────────────────────
    if (table === "saved_destinations" && type === "INSERT") {
      const userId = str(record?.user_id);
      const destination = record?.destination as
        | { name?: unknown }
        | null
        | undefined;
      const destinationName = str(destination?.name);
      if (!userId) {
        return NextResponse.json({ skipped: "no_user_id", table });
      }
      if (!destinationName) {
        return NextResponse.json({ skipped: "no_destination_name", table });
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", userId)
        .maybeSingle();
      if (profileErr) {
        console.error("[hooks/supabase] profile lookup failed:", profileErr.message);
        return NextResponse.json(
          { error: "profile_lookup_failed", detail: profileErr.message },
          { status: 502 },
        );
      }
      const email = str(profile?.email);
      if (!email) {
        return NextResponse.json({ skipped: "no_profile_email", table });
      }

      const result = await sendTemplateEmail({
        template: "saved_destination",
        to: email,
        data: {
          name: str(profile?.display_name) ?? "there",
          destinationName,
        },
      });
      if (!result.ok) {
        console.error("[hooks/supabase] saved_destination send failed:", result);
        return NextResponse.json(
          { error: result.error, detail: result.detail },
          { status: 502 },
        );
      }
      return NextResponse.json({
        sent: "saved_destination",
        id: result.id,
        to: email,
      });
    }

    // Any other table/event combination: acknowledge and ignore.
    return NextResponse.json({ skipped: "unhandled_event", table, type });
  } catch (err) {
    console.error(
      "[hooks/supabase] unexpected error:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "internal", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
