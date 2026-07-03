import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { Resend } from "resend";
import { renderConfirmSignup } from "@/emails/auth/confirmSignup";
import { renderResetPassword } from "@/emails/auth/resetPassword";
import { renderMagicLink } from "@/emails/auth/magicLink";
import { renderEmailChange } from "@/emails/auth/emailChange";
import { renderGenericAction } from "@/emails/auth/genericAction";

// Supabase "Send Email" auth hook receiver. Supabase calls this instead of
// sending its own built-in emails, so every auth email (confirm signup,
// recovery, magic link, email change, ...) goes out as a branded Triply email
// via Resend, wrapped in the same emails/layout.ts shell as the welcome email.
//
// Signed per the Standard Webhooks spec: Supabase provides a secret shaped
// "v1,whsec_<base64>"; the prefix is stripped and the raw request body is
// verified against the webhook-* headers. Bad signature → 401.
//
// Retry safety: Supabase retries on non-2xx. This handler is stateless and a
// pure function of the payload — a retry at worst re-sends the same email,
// never corrupts anything. Success returns 200 {} so no retry happens.
//
// Logging: action type, recipient and Resend id only. NEVER the token,
// token_hash, or the action URL (it embeds the token_hash).

const FROM = "Triply <noreply@flytriply.eu>";

interface HookUser {
  email?: string;
  new_email?: string;
  user_metadata?: { display_name?: string };
}

interface HookEmailData {
  token?: string;
  token_hash?: string;
  token_new?: string;
  token_hash_new?: string;
  redirect_to?: string;
  email_action_type?: string;
  site_url?: string;
}

function buildVerifyUrl(
  supabaseUrl: string,
  tokenHash: string,
  actionType: string,
  redirectTo: string,
): string {
  const params = new URLSearchParams({
    token: tokenHash,
    type: actionType,
    redirect_to: redirectTo,
  });
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1/verify?${params.toString()}`;
}

function renderForAction(
  actionType: string,
  actionUrl: string | null,
): { subject: string; html: string; text: string } {
  if (!actionUrl) return renderGenericAction(actionType, null);
  switch (actionType) {
    case "signup":
      return renderConfirmSignup(actionUrl);
    case "recovery":
      return renderResetPassword(actionUrl);
    case "magiclink":
      return renderMagicLink(actionUrl);
    case "email_change":
      return renderEmailChange(actionUrl);
    default:
      // invite, reauthentication, "email", future types — never silently fail.
      return renderGenericAction(actionType, actionUrl);
  }
}

export async function POST(req: NextRequest) {
  const rawSecret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!rawSecret || !supabaseUrl || !apiKey) {
    console.error(
      "[hooks/auth-email] missing env:",
      !rawSecret ? "SUPABASE_AUTH_HOOK_SECRET" : "",
      !supabaseUrl ? "SUPABASE_URL" : "",
      !apiKey ? "RESEND_API_KEY" : "",
    );
    return NextResponse.json(
      { error: { http_code: 500, message: "auth email hook not configured" } },
      { status: 500 },
    );
  }

  // Signature verification needs the RAW body string — read it before parsing.
  const payload = await req.text();
  let parsed: { user?: HookUser; email_data?: HookEmailData };
  try {
    const wh = new Webhook(rawSecret.replace("v1,whsec_", ""));
    wh.verify(payload, Object.fromEntries(req.headers));
    parsed = JSON.parse(payload) as typeof parsed;
  } catch {
    return NextResponse.json(
      { error: { http_code: 401, message: "invalid webhook signature" } },
      { status: 401 },
    );
  }

  try {
    const user = parsed.user ?? {};
    const emailData = parsed.email_data ?? {};
    const actionType = emailData.email_action_type ?? "unknown";
    const redirectTo = emailData.redirect_to || emailData.site_url || "";

    const url = (tokenHash: string | undefined): string | null =>
      tokenHash
        ? buildVerifyUrl(supabaseUrl, tokenHash, actionType, redirectTo)
        : null;

    // Recipient/token pairs. The email_change field names are REVERSED for
    // backward compatibility (per Supabase docs): token_hash pairs with the
    // NEW address, token_hash_new pairs with the CURRENT address. With secure
    // email change enabled both addresses must confirm, so we send both.
    const sends: Array<{ to: string; actionUrl: string | null }> = [];
    if (actionType === "email_change" && emailData.token_hash_new) {
      if (user.new_email) {
        sends.push({ to: user.new_email, actionUrl: url(emailData.token_hash) });
      }
      if (user.email) {
        sends.push({ to: user.email, actionUrl: url(emailData.token_hash_new) });
      }
    } else if (actionType === "email_change") {
      const to = user.new_email ?? user.email;
      if (to) sends.push({ to, actionUrl: url(emailData.token_hash) });
    } else if (user.email) {
      sends.push({ to: user.email, actionUrl: url(emailData.token_hash) });
    }

    if (sends.length === 0) {
      console.error("[hooks/auth-email] no recipient in payload", { actionType });
      return NextResponse.json(
        { error: { http_code: 400, message: "payload has no recipient email" } },
        { status: 400 },
      );
    }

    const resend = new Resend(apiKey);
    for (const s of sends) {
      const rendered = renderForAction(actionType, s.actionUrl);
      const { data, error } = await resend.emails.send({
        from: FROM,
        to: s.to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });
      if (error) {
        console.error("[hooks/auth-email] send failed:", {
          actionType,
          to: s.to,
          error: error.message,
        });
        // Non-2xx → Supabase retries the hook. Stateless, so a retry just
        // attempts the same send again.
        return NextResponse.json(
          { error: { http_code: 502, message: `email send failed: ${error.message}` } },
          { status: 502 },
        );
      }
      console.log("[hooks/auth-email] sent:", {
        actionType,
        to: s.to,
        id: data?.id ?? null,
      });
    }

    return NextResponse.json({});
  } catch (err) {
    // Never leak an unhandled 500 — always structured.
    console.error(
      "[hooks/auth-email] unexpected error:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: { http_code: 500, message: "internal error handling auth email" } },
      { status: 500 },
    );
  }
}
