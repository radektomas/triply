// Shared branded layout for all Triply transactional emails.
//
// Email-client constraints drive everything here: table-based layout, ALL CSS
// inline (many clients strip <style>), max-width 600, system font stack (no
// webfonts in email), bulletproof link-buttons instead of real buttons.
// Brand: cream/coral/teal boarding-pass feel, matching app/globals.css tokens.

export const BRAND = {
  coral: "#FF6B47",
  coralDeep: "#E8533A",
  teal: "#0D7377",
  cream: "#FFE4CC",
  bg: "#F8F7F5",
  ink: "#1A1A1A",
  muted: "#6B7280",
  border: "#E5E7EB",
} as const;

export const SITE_URL = "https://flytriply.eu";
export const LOGO_URL = `${SITE_URL}/triply-logo-email.png`;

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO_STACK = "'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace";

/** Escape user-provided strings before interpolating into HTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Coral pill CTA, bulletproof (padded link, no <button>). */
export function ctaButton(href: string, label: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 28px auto 8px;">
    <tr>
      <td style="border-radius: 999px; background-color: ${BRAND.coral};">
        <a href="${href}" target="_blank"
           style="display: inline-block; padding: 13px 32px; font-family: ${FONT_STACK}; font-size: 15px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 999px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

/**
 * Boarding-pass style card: cream ticket with a mono "stub" row and a dashed
 * perforation line above the content. The one bespoke brand element every
 * template reuses.
 */
export function ticketCard(stubLabel: string, innerHtml: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color: ${BRAND.cream}; border-radius: 16px; margin: 24px 0;">
    <tr>
      <td style="padding: 14px 24px 12px;">
        <span style="font-family: ${MONO_STACK}; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: ${BRAND.teal}; font-weight: 700;">
          ${stubLabel}
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 24px;">
        <div style="border-top: 2px dashed rgba(13, 115, 119, 0.35); font-size: 0; line-height: 0;">&nbsp;</div>
      </td>
    </tr>
    <tr>
      <td style="padding: 14px 24px 20px;">
        ${innerHtml}
      </td>
    </tr>
  </table>`;
}

/** Wraps template body content in the shared branded shell. */
export function renderLayout(opts: {
  preheader: string;
  bodyHtml: string;
}): string {
  const { preheader, bodyHtml } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Triply</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.bg};">
  <!-- Preheader: shows next to the subject in the inbox, hidden in the body -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BRAND.bg};">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="width: 100%; max-width: 600px;">

          <!-- Header: wordmark on cream band -->
          <tr>
            <td align="center" style="background-color: ${BRAND.cream}; border-radius: 20px 20px 0 0; padding: 26px 24px 22px;">
              <a href="${SITE_URL}" target="_blank" style="text-decoration: none;">
                <img src="${LOGO_URL}" alt="Triply" width="150"
                     style="display: block; width: 150px; max-width: 60%; height: auto; border: 0;">
              </a>
            </td>
          </tr>

          <!-- Perforation between header and body -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 0 24px;">
              <div style="border-top: 2px dashed ${BRAND.border}; font-size: 0; line-height: 0;">&nbsp;</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #FFFFFF; border-radius: 0 0 20px 20px; padding: 12px 32px 36px; font-family: ${FONT_STACK}; color: ${BRAND.ink};">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 24px 8px; font-family: ${FONT_STACK};">
              <p style="margin: 0 0 6px; font-size: 12px; line-height: 1.6; color: ${BRAND.muted};">
                You are receiving this because you have a Triply account.
              </p>
              <p style="margin: 0 0 6px; font-size: 12px; line-height: 1.6; color: ${BRAND.muted};">
                <a href="{{unsubscribe_url}}" style="color: ${BRAND.teal}; text-decoration: underline;">Unsubscribe</a>
                &nbsp;&middot;&nbsp;
                <a href="${SITE_URL}" style="color: ${BRAND.teal}; text-decoration: underline;">flytriply.eu</a>
              </p>
              <p style="margin: 0; font-size: 11px; line-height: 1.6; color: ${BRAND.muted};">
                Triply, Prague, Czech Republic
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Standard paragraph helper so all templates share one type rhythm. */
export function para(html: string, opts?: { muted?: boolean; size?: number }): string {
  const color = opts?.muted ? BRAND.muted : BRAND.ink;
  const size = opts?.size ?? 15;
  return `<p style="margin: 0 0 16px; font-family: ${FONT_STACK}; font-size: ${size}px; line-height: 1.65; color: ${color};">${html}</p>`;
}

/** Editorial heading (h1-equivalent inside the email body). */
export function heading(text: string): string {
  return `<h1 style="margin: 18px 0 14px; font-family: ${FONT_STACK}; font-size: 26px; line-height: 1.25; font-weight: 800; color: ${BRAND.ink};">${text}</h1>`;
}
