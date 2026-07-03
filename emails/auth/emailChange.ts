import {
  renderLayout,
  escapeHtml,
  ctaButton,
  para,
  heading,
} from "../layout";

export function renderEmailChange(actionUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const url = escapeHtml(actionUrl);
  const bodyHtml = `
    ${heading("Confirm your new email")}
    ${para(
      `You asked to change the email on your Triply account. Confirm below and we will update your boarding details.`,
    )}
    ${ctaButton(url, "Confirm new email")}
    ${para(
      `If the button does not work, paste this link into your browser:<br><a href="${url}" style="color: #0D7377; word-break: break-all;">${url}</a>`,
      { muted: true, size: 12 },
    )}
    ${para(
      `If you did not request this change, ignore this email and nothing changes. You may also want to reset your password.`,
      { muted: true, size: 12 },
    )}`;

  return {
    subject: "Confirm your new Triply email",
    html: renderLayout({
      preheader: "Confirm the change and we update your boarding details.",
      bodyHtml,
    }),
    text: [
      `Confirm your new email`,
      ``,
      `Confirm: ${actionUrl}`,
      ``,
      `If you did not request this change, ignore this email and nothing changes.`,
    ].join("\n"),
  };
}
