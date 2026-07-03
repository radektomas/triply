import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  renderEmail,
  EMAIL_TEMPLATES,
  type EmailTemplate,
} from "@/emails";

// Transactional email sender, called by n8n workflows and Supabase hooks
// (never by the browser). Locked behind the x-triply-secret header so the
// endpoint can't be used as an open relay.
//
//   POST /api/email
//   headers: { "x-triply-secret": TRIPLY_EMAIL_SECRET }
//   body:    { template: "welcome" | "saved_destination" | "followup_1"
//                       | "followup_2",
//              to: string,
//              data: { name?, destinationName? } }

const FROM = "Triply <noreply@flytriply.eu>";

// Loose-but-useful shape check; Resend does the authoritative validation.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const secret = process.env.TRIPLY_EMAIL_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!secret || !apiKey) {
    console.error(
      "[api/email] missing env:",
      !secret ? "TRIPLY_EMAIL_SECRET" : "",
      !apiKey ? "RESEND_API_KEY" : "",
    );
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
  if (!EMAIL_TEMPLATES.includes(template)) {
    return NextResponse.json(
      {
        error: "unknown_template",
        detail: `template must be one of: ${EMAIL_TEMPLATES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const to = typeof body.to === "string" ? body.to.trim() : "";
  if (!EMAIL_RE.test(to)) {
    return NextResponse.json(
      { error: "invalid_recipient", detail: "`to` must be an email address" },
      { status: 400 },
    );
  }

  const data =
    body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : {};

  let rendered;
  try {
    rendered = renderEmail(template, data);
  } catch (err) {
    return NextResponse.json(
      {
        error: "invalid_template_data",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    );
  }

  try {
    const resend = new Resend(apiKey);
    const { data: sent, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    if (error) {
      console.error("[api/email] resend error:", error);
      return NextResponse.json(
        { error: "send_failed", detail: error.message },
        { status: 502 },
      );
    }

    return NextResponse.json({ id: sent?.id ?? null, template, to });
  } catch (err) {
    console.error("[api/email] send threw:", err);
    return NextResponse.json(
      {
        error: "send_failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
