import { NextRequest, NextResponse } from "next/server";
import { sendTemplateEmail } from "@/lib/email/send";
import { type EmailTemplate } from "@/emails";

// Transactional email sender, called by n8n workflows and Supabase hooks
// (never by the browser). Locked behind the x-triply-secret header so the
// endpoint can't be used as an open relay. Render + Resend logic lives in
// lib/email/send.ts (shared with /api/hooks/supabase and /api/cron/followups);
// this route only does auth + request validation + status mapping.
//
//   POST /api/email
//   headers: { "x-triply-secret": TRIPLY_EMAIL_SECRET }
//   body:    { template: "welcome" | "saved_destination" | "followup_1"
//                       | "followup_2",
//              to: string,
//              data: { name?, destinationName? } }

const STATUS_BY_ERROR: Record<string, number> = {
  email_not_configured: 500,
  unknown_template: 400,
  invalid_recipient: 400,
  invalid_template_data: 400,
  send_failed: 502,
};

export async function POST(req: NextRequest) {
  const secret = process.env.TRIPLY_EMAIL_SECRET;
  if (!secret) {
    console.error("[api/email] missing env: TRIPLY_EMAIL_SECRET");
    return NextResponse.json(
      { error: "email_not_configured" },
      { status: 500 },
    );
  }

  if (req.headers.get("x-triply-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { template?: unknown; to?: unknown; data?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 });
  }

  const template = body.template as EmailTemplate;
  const to = typeof body.to === "string" ? body.to : "";
  const data =
    body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : {};

  const result = await sendTemplateEmail({ template, to, data });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, detail: result.detail },
      { status: STATUS_BY_ERROR[result.error] ?? 500 },
    );
  }

  return NextResponse.json({ id: result.id, template, to: to.trim() });
}
