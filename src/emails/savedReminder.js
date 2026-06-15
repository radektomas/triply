/**
 * Triply — "saved destinations reminder" transactional email.
 *
 * buildSavedReminderEmail({ email, destinations }) => { subject, html }
 *
 * `destinations` rows come straight from a Supabase query with these fields:
 *   { saved_id, slug, trip_id, name, country, tagline, origin,
 *     check_in, check_out, nights, total_typical, flight_typical }
 *   - check_in / check_out: ISO date strings ("2026-07-15")
 *   - nights: integer
 *   - total_typical / flight_typical: numeric strings in euros
 *
 * The CTA for each destination deep-links to EXACTLY:
 *   https://flytriply.eu/trip/${trip_id}?d=${slug}
 * (path = trip_id UUID, query d = slug). That route renders read-only with no
 * login required, so cold clicks from the inbox land straight on the trip.
 *
 * HTML is email-client-safe: table-based layout, fully inline CSS, no <style>
 * blocks, no flex/grid — renders in Gmail, Apple Mail and Outlook.
 */

// ─── Tweakable constants ─────────────────────────────────────────────────────

/** Display currency. Hardcoded EUR for now; single source of truth. */
const CURRENCY = "€";

/** Canonical site origin used for every link. */
const SITE_URL = "https://flytriply.eu";

/**
 * Hosted mascot/wordmark image. Email clients strip inline SVG, so this MUST be
 * a hosted raster (PNG). Defaults to the wordmark already shipped in /public
 * (served at this URL after deploy). Swap for a dedicated mascot PNG if desired.
 */
const MASCOT_IMAGE_URL = `${SITE_URL}/triply-logo-email.png`;

/**
 * The user's saved-trips surface. NOTE: currently UNUSED in this email. /profile
 * requires a session, but this is a retargeting email opened 1–2 weeks later, so
 * most clicks are logged-out and would hit the sign-in wall. Until /profile is
 * logged-out-readable (backlog), the "+ N more" overflow links to the first
 * destination's read-only /trip/ deep link instead. Kept here for when an
 * account view becomes publicly viewable.
 */
const ACCOUNT_URL = `${SITE_URL}/profile`;

// Brand palette (pulled from app/globals.css @theme tokens).
const TEAL = "#0D7377";
const ACCENT = "#FF6B47";
const CREAM = "#FFE4CC";
const PAGE_BG = "#F8F7F5";
const CARD_BG = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#1A1A1A";
const MUTED = "#6B7280";

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Group an integer/decimal euro string with thousands separators. */
function formatEuro(value) {
  const s = String(value == null ? "" : value).trim();
  const group = (intPart) => intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (/^\d+$/.test(s)) return group(s);
  if (/^\d+\.\d+$/.test(s)) {
    const [i, f] = s.split(".");
    return `${group(i)}.${f}`;
  }
  return escapeHtml(s);
}

function parseYmd(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim());
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, mo, d };
}

/**
 * Human-friendly date range, e.g.:
 *   same month  → "15–18 Jul 2026"
 *   same year   → "29 Jul – 2 Aug 2026"
 *   cross year  → "30 Dec 2026 – 2 Jan 2027"
 */
function formatDateRange(checkIn, checkOut) {
  const a = parseYmd(checkIn);
  const b = parseYmd(checkOut);
  const one = (p) => `${p.d} ${MONTHS[p.mo - 1]} ${p.y}`;
  if (a && b) {
    if (a.y === b.y && a.mo === b.mo) {
      return `${a.d}–${b.d} ${MONTHS[a.mo - 1]} ${a.y}`;
    }
    if (a.y === b.y) {
      return `${a.d} ${MONTHS[a.mo - 1]} – ${b.d} ${MONTHS[b.mo - 1]} ${a.y}`;
    }
    return `${one(a)} – ${one(b)}`;
  }
  if (a) return one(a);
  if (b) return one(b);
  return "";
}

/** The one and only deep-link shape. */
function buildDeepLink(tripId, slug) {
  return `${SITE_URL}/trip/${encodeURIComponent(
    String(tripId || ""),
  )}?d=${encodeURIComponent(String(slug || ""))}`;
}

// ─── Card renderer ───────────────────────────────────────────────────────────

function renderCard(d) {
  const name = escapeHtml(d.name || "Your destination");
  const country = d.country ? escapeHtml(d.country) : "";
  const title = country ? `${name}, ${country}` : name;
  const tagline = d.tagline ? escapeHtml(d.tagline) : "";

  const dates = formatDateRange(d.check_in, d.check_out);
  const nightsNum = parseInt(d.nights, 10);
  const nights =
    Number.isFinite(nightsNum) && nightsNum > 0
      ? `${nightsNum} ${nightsNum === 1 ? "night" : "nights"}`
      : "";
  const datesLine = [dates, nights].filter(Boolean).join(" · ");

  const origin = d.origin ? `from ${escapeHtml(d.origin)}` : "";
  const hasTotal =
    d.total_typical != null && String(d.total_typical).trim() !== "";
  const total = hasTotal
    ? `~${CURRENCY}${formatEuro(d.total_typical)} total`
    : "";

  const hasFlight =
    d.flight_typical != null && String(d.flight_typical).trim() !== "";
  const flightLine = hasFlight
    ? `Flights to ${name} are around ${CURRENCY}${formatEuro(
        d.flight_typical,
      )} right now — prices move, worth a look.`
    : "";

  const link = buildDeepLink(d.trip_id, d.slug);

  return `
  <tr>
    <td style="padding:0 24px 16px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background-color:${CARD_BG};border:1px solid ${BORDER};border-radius:14px;">
        <tr>
          <td style="padding:20px 22px;">
            <p style="margin:0 0 2px 0;font-family:${FONT_STACK};font-size:18px;line-height:1.3;font-weight:700;color:${TEXT};">${title}</p>
            ${
              tagline
                ? `<p style="margin:0 0 12px 0;font-family:${FONT_STACK};font-size:14px;line-height:1.5;color:${MUTED};">${tagline}</p>`
                : `<div style="height:8px;line-height:8px;font-size:8px;">&nbsp;</div>`
            }
            ${
              datesLine
                ? `<p style="margin:0 0 2px 0;font-family:${FONT_STACK};font-size:14px;line-height:1.5;color:${TEXT};">${escapeHtml(
                    datesLine,
                  )}</p>`
                : ""
            }
            ${
              origin
                ? `<p style="margin:0 0 8px 0;font-family:${FONT_STACK};font-size:14px;line-height:1.5;color:${MUTED};">${origin}</p>`
                : ""
            }
            ${
              total
                ? `<p style="margin:0 0 12px 0;font-family:${FONT_STACK};font-size:16px;line-height:1.4;font-weight:700;color:${TEAL};">${total}</p>`
                : ""
            }
            ${
              flightLine
                ? `<p style="margin:0 0 16px 0;font-family:${FONT_STACK};font-size:13px;line-height:1.5;color:${ACCENT};">${flightLine}</p>`
                : ""
            }
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="${TEAL}" style="border-radius:10px;">
                  <a href="${link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 22px;font-family:${FONT_STACK};font-size:15px;line-height:1;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">View your trip →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ─── Main builder ────────────────────────────────────────────────────────────

function buildSavedReminderEmail({ email, destinations } = {}) {
  const list = Array.isArray(destinations) ? destinations : [];
  const shown = list.slice(0, 3);
  const extra = Math.max(0, list.length - shown.length);

  const names = shown.map((d) => d.name).filter(Boolean);
  const top = names[0] || "your next trip";

  // Subject — always includes the top destination name.
  const subject =
    names.length > 0
      ? `Still dreaming of ${top}? Your saved trips are waiting`
      : "Your saved Triply trips are waiting";

  // Headline — references the actual saved names, not a generic line.
  let headline;
  if (names.length === 0) {
    headline = "Your saved trips are waiting";
  } else if (names.length === 1) {
    headline = `Still dreaming of ${escapeHtml(names[0])}?`;
  } else if (names.length === 2) {
    headline = `${escapeHtml(names[0])} and ${escapeHtml(
      names[1],
    )} are still on your list`;
  } else {
    headline = `${escapeHtml(names[0])}, ${escapeHtml(
      names[1],
    )} &amp; more are still on your list`;
  }

  const cards = shown.map(renderCard).join("");

  // Overflow link points at the most-recent destination's read-only /trip/
  // deep link (same shape as the card buttons), NOT /profile — so logged-out
  // readers of this retargeting email never dead-end on a sign-in wall.
  const moreLink =
    list.length > 0 ? buildDeepLink(list[0].trip_id, list[0].slug) : SITE_URL;
  const moreLine =
    extra > 0
      ? `
  <tr>
    <td align="center" style="padding:4px 24px 8px 24px;">
      <p style="margin:0 0 4px 0;font-family:${FONT_STACK};font-size:13px;line-height:1.5;color:${MUTED};">+ ${extra} more ${
        extra === 1 ? "trip" : "trips"
      } saved</p>
      <a href="${moreLink}" target="_blank" rel="noopener noreferrer" style="font-family:${FONT_STACK};font-size:14px;line-height:1.5;color:${TEAL};text-decoration:underline;font-weight:600;">View all your saved trips →</a>
    </td>
  </tr>`
      : "";

  const preheader =
    names.length > 0
      ? `The trips you saved on Triply — ${escapeHtml(
          names.join(", "),
        )} — are one tap away.`
      : "The trips you saved on Triply are one tap away.";

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${PAGE_BG};">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAGE_BG};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:${CARD_BG};border-radius:18px;overflow:hidden;border:1px solid ${BORDER};">

          <!-- Header band -->
          <tr>
            <td align="center" bgcolor="${CREAM}" style="background-color:${CREAM};padding:28px 24px 24px 24px;">
              <img src="${MASCOT_IMAGE_URL}" width="180" alt="Triply" style="display:block;width:180px;max-width:60%;height:auto;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>

          <!-- Headline + intro -->
          <tr>
            <td style="padding:28px 24px 8px 24px;">
              <h1 style="margin:0 0 10px 0;font-family:${FONT_STACK};font-size:24px;line-height:1.25;font-weight:800;color:${TEXT};">${headline}</h1>
              <p style="margin:0 0 4px 0;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${MUTED};">
                You saved ${
                  names.length > 1 ? "these" : "this"
                } on Triply — here's a quick nudge before the good dates fill up. No pressure, just the ${
    names.length > 1 ? "trips" : "trip"
  } you liked, one tap away.
              </p>
            </td>
          </tr>

          <tr><td style="height:16px;line-height:16px;font-size:16px;">&nbsp;</td></tr>

          <!-- Cards -->
          ${cards}
          ${moreLine}

          <tr><td style="height:8px;line-height:8px;font-size:8px;">&nbsp;</td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px 28px 24px;border-top:1px solid ${BORDER};">
              <p style="margin:0 0 6px 0;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${MUTED};">
                You're getting this because you saved trips on <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer" style="color:${TEAL};text-decoration:underline;">Triply</a>. Prices are typical estimates in ${CURRENCY === "€" ? "EUR" : CURRENCY} and can change.
              </p>
              <p style="margin:0;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${MUTED};">© 2026 Triply · ${escapeHtml(
    email || "",
  )}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

module.exports = { buildSavedReminderEmail };
