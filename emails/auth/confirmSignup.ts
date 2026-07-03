import {
  renderLayout,
  escapeHtml,
  ctaButton,
  ticketCard,
  para,
  heading,
} from "../layout";

export function renderConfirmSignup(actionUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const url = escapeHtml(actionUrl);
  const bodyHtml = `
    ${heading("Confirm your email")}
    ${para(
      `One tap and your Triply account is ready. Confirming your email keeps your saved trips safe and lets us hold your plans for you.`,
    )}
    ${ticketCard(
      "Boarding pass &middot; not yet valid",
      para(`Stamp it below and you are officially aboard.`, { size: 14 }),
    )}
    ${ctaButton(url, "Confirm my email")}
    ${para(
      `If the button does not work, paste this link into your browser:<br><a href="${url}" style="color: #0D7377; word-break: break-all;">${url}</a>`,
      { muted: true, size: 12 },
    )}
    ${para(`Did not sign up for Triply? You can safely ignore this email.`, {
      muted: true,
      size: 12,
    })}`;

  return {
    subject: "Confirm your email to board Triply",
    html: renderLayout({
      preheader: "One tap and your Triply account is ready.",
      bodyHtml,
    }),
    text: [
      `Confirm your email`,
      ``,
      `One tap and your Triply account is ready.`,
      ``,
      `Confirm: ${actionUrl}`,
      ``,
      `Did not sign up for Triply? You can safely ignore this email.`,
    ].join("\n"),
  };
}
