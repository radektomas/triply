import "server-only";
import { Resend } from "resend";
import { renderEmail, EMAIL_TEMPLATES, type EmailTemplate } from "@/emails";

// Shared transactional-email sender. Single implementation of template lookup,
// render, and the Resend call — used by POST /api/email (external callers with
// the shared secret), POST /api/hooks/supabase (instant lifecycle emails), and
// GET /api/cron/followups (daily nudges), so all senders stay in lockstep.
//
// Non-throwing by design: callers in batch loops (the cron) must be able to
// record a failure and continue, so every outcome is a structured result.

export const EMAIL_FROM = "Triply <noreply@flytriply.eu>";

// Loose-but-useful shape check; Resend does the authoritative validation.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SendTemplateResult =
  | { ok: true; id: string | null }
  | {
      ok: false;
      error:
        | "email_not_configured"
        | "unknown_template"
        | "invalid_recipient"
        | "invalid_template_data"
        | "send_failed";
      detail?: string;
    };

export async function sendTemplateEmail(opts: {
  template: string;
  to: string;
  data?: Record<string, unknown>;
}): Promise<SendTemplateResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email/send] RESEND_API_KEY not set");
    return { ok: false, error: "email_not_configured" };
  }

  const template = opts.template as EmailTemplate;
  if (!EMAIL_TEMPLATES.includes(template)) {
    return {
      ok: false,
      error: "unknown_template",
      detail: `template must be one of: ${EMAIL_TEMPLATES.join(", ")}`,
    };
  }

  const to = opts.to?.trim() ?? "";
  if (!EMAIL_RE.test(to)) {
    return {
      ok: false,
      error: "invalid_recipient",
      detail: "`to` must be an email address",
    };
  }

  let rendered;
  try {
    rendered = renderEmail(template, opts.data ?? {});
  } catch (err) {
    return {
      ok: false,
      error: "invalid_template_data",
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    if (error) {
      console.error("[email/send] resend error:", { template, to, error: error.message });
      return { ok: false, error: "send_failed", detail: error.message };
    }
    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    console.error("[email/send] send threw:", { template, to, err });
    return {
      ok: false,
      error: "send_failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
