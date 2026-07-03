import {
  renderLayout,
  escapeHtml,
  ctaButton,
  para,
  heading,
  SITE_URL,
} from "../layout";

/**
 * Fallback for any email_action_type we don't have a bespoke template for
 * (invite, reauthentication, the *_notification types, future additions).
 * With an action URL it renders a confirm CTA; without one (notification-only
 * events carry no token) it renders a plain informational note, so no action
 * type ever silently fails or ships a broken button.
 */
export function renderGenericAction(
  actionType: string,
  actionUrl: string | null,
): { subject: string; html: string; text: string } {
  const label = escapeHtml(actionType.replace(/_/g, " "));

  const bodyHtml = actionUrl
    ? `
    ${heading("Confirm this action")}
    ${para(
      `We received a request on your Triply account (${label}). If this was you, confirm it below.`,
    )}
    ${ctaButton(escapeHtml(actionUrl), "Confirm")}
    ${para(
      `If the button does not work, paste this link into your browser:<br><a href="${escapeHtml(actionUrl)}" style="color: #0D7377; word-break: break-all;">${escapeHtml(actionUrl)}</a>`,
      { muted: true, size: 12 },
    )}
    ${para(`If you did not request this, you can safely ignore this email.`, {
      muted: true,
      size: 12,
    })}`
    : `
    ${heading("A change on your account")}
    ${para(
      `This is a quick heads-up that something changed on your Triply account (${label}). No action is needed.`,
    )}
    ${para(
      `If this was not you, sign in and review your account, or reset your password.`,
      { muted: true, size: 13 },
    )}
    ${ctaButton(`${SITE_URL}/profile`, "Review my account")}`;

  return {
    subject: actionUrl
      ? "Confirm this action on your Triply account"
      : "A change on your Triply account",
    html: renderLayout({
      preheader: actionUrl
        ? "Confirm the request on your Triply account."
        : "A quick heads-up about your Triply account.",
      bodyHtml,
    }),
    text: actionUrl
      ? [
          `Confirm this action (${actionType})`,
          ``,
          `Confirm: ${actionUrl}`,
          ``,
          `If you did not request this, ignore this email.`,
        ].join("\n")
      : [
          `A change on your Triply account (${actionType}).`,
          ``,
          `No action is needed. If this was not you, review your account: ${SITE_URL}/profile`,
        ].join("\n"),
  };
}
