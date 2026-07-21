import "server-only";
import { Resend } from "resend";
import { renderEmail, EMAIL_TEMPLATES, type EmailTemplate } from "@/emails";
import { UNSUBSCRIBE_PLACEHOLDER } from "@/emails/layout";
import { classifyEmail } from "@/emails/classification";
import { getMailability, isMailable } from "@/lib/email/suppression";
import {
  buildUnsubscribeUrl,
  buildOneClickUnsubscribeUrl,
} from "@/lib/email/unsubscribeToken";

// Shared transactional-email sender. Single implementation of template lookup,
// render, and the Resend call — used by POST /api/email (external callers with
// the shared secret), lib/email/lifecycle.ts (in-process welcome and
// saved-destination sends), and GET /api/cron/followups (daily nudges), so all
// senders stay in lockstep.
//
// Non-throwing by design: callers in batch loops (the cron) must be able to
// record a failure and continue, so every outcome is a structured result.
//
// Consent gate: templates classified "marketing" in emails/classification.ts
// are refused unless the recipient's profile has marketing_opt_in = true and
// unsubscribed_at IS NULL, and they always ship a per-recipient unsubscribe
// link plus RFC 8058 one-click headers. Templates classified "transactional"
// bypass all of that — they are strictly necessary and must never be
// suppressed. Auth emails do not pass through here at all (see
// app/api/hooks/auth-email/route.ts).

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
        | "not_consented"
        | "suppressed"
        | "unsubscribe_unavailable"
        | "send_failed";
      detail?: string;
    };

export async function sendTemplateEmail(opts: {
  template: string;
  to: string;
  data?: Record<string, unknown>;
  /**
   * Recipient's profile id when the caller already knows it (DB webhooks, the
   * followups cron). Skips the email-based profile lookup and makes the
   * unsubscribe token exact. Omit for external callers — consent is then
   * resolved by email address.
   */
  userId?: string;
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

  const emailClass = classifyEmail(template);

  // ── Consent gate (marketing only) ──────────────────────────────────────────
  // Resolved BEFORE rendering so a suppressed recipient costs one cheap query
  // and no Resend call. Transactional mail skips this entirely.
  let unsubscribeUrl: string | null = null;
  let oneClickUrl: string | null = null;

  if (emailClass === "marketing") {
    const profile = await getMailability({ userId: opts.userId, email: to });
    if (!profile) {
      // No profile row → no recorded consent. Refuse rather than assume.
      return {
        ok: false,
        error: "not_consented",
        detail: "no profile found for recipient; marketing requires opt-in",
      };
    }
    if (profile.unsubscribedAt) {
      return {
        ok: false,
        error: "suppressed",
        detail: `recipient unsubscribed at ${profile.unsubscribedAt}`,
      };
    }
    if (!isMailable(profile)) {
      return {
        ok: false,
        error: "not_consented",
        detail: "recipient has not opted in to marketing email",
      };
    }

    unsubscribeUrl = buildUnsubscribeUrl(profile.userId);
    oneClickUrl = buildOneClickUnsubscribeUrl(profile.userId);
    if (!unsubscribeUrl || !oneClickUrl) {
      // No signing secret configured. Sending marketing mail without a working
      // opt-out is exactly the bug this path exists to prevent, so fail closed.
      console.error(
        "[email/send] cannot mint unsubscribe token — set UNSUBSCRIBE_SECRET (or TRIPLY_EMAIL_SECRET)",
      );
      return {
        ok: false,
        error: "unsubscribe_unavailable",
        detail: "no unsubscribe signing secret configured",
      };
    }
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

  // ── Per-recipient unsubscribe interpolation ────────────────────────────────
  let html = rendered.html;
  let text = rendered.text;
  if (unsubscribeUrl) {
    html = html.split(UNSUBSCRIBE_PLACEHOLDER).join(unsubscribeUrl);
    text = `${text}\n\n—\nYou opted in to trip reminders and suggestions.\nUnsubscribe: ${unsubscribeUrl}`;
  }

  // Belt and braces: never let an unsubstituted placeholder reach an inbox.
  // Catches a marketing template that somehow rendered without the consent
  // branch, or a transactional template that wrongly asked for the footer.
  if (html.includes(UNSUBSCRIBE_PLACEHOLDER)) {
    console.error("[email/send] unsubstituted unsubscribe placeholder:", {
      template,
      emailClass,
    });
    return {
      ok: false,
      error: "unsubscribe_unavailable",
      detail: "rendered html still contains the unsubscribe placeholder",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: rendered.subject,
      html,
      text,
      // RFC 8058 one-click unsubscribe — marketing ONLY. Adding these to
      // transactional mail would advertise an opt-out we deliberately do not
      // honour, and would let a mail client suppress account-critical email.
      ...(oneClickUrl
        ? {
            headers: {
              "List-Unsubscribe": `<${oneClickUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }
        : {}),
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
