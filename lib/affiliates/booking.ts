/**
 * Booking.com affiliate deep links via CJ (Commission Junction).
 *
 * Booking.com's CJ program supports "deep linking": take the CJ click-tracking
 * URL and append `?url=<URL-encoded Booking.com destination URL>`. CJ records
 * the click for attribution, then redirects the user to the decoded Booking.com
 * URL. An optional `&sid=<source>` param is passed straight through to CJ's
 * reports so clicks can be segmented by surface (which Triply page sent them).
 *
 * Format:
 *   https://www.tkqlhce.com/click-101732813-15735418?url=<ENCODED>&sid=<source>
 *
 * Triply captures month + nights + travelers, NOT exact calendar dates, so we
 * deliberately omit checkin/checkout and let Booking.com prompt the user for
 * dates on arrival. We DO pass the destination (`ss`) and adult count
 * (`group_adults`). When a `currency` is supplied it is added as
 * `selected_currency` to the INNER Booking URL (before encoding), so the user's
 * chosen currency carries through to Booking's results page.
 *
 * @example
 * buildBookingAffiliateLink({ destination: "Valencia" });
 * // https://www.tkqlhce.com/click-101732813-15735418?url=https%3A%2F%2Fwww.booking.com%2Fsearchresults.html%3Fss%3DValencia%26group_adults%3D2%26no_rooms%3D1&sid=triply_web
 *
 * @example
 * buildBookingAffiliateLink({ destination: "Valencia", currency: "CZK" });
 * // ...url=...%3Fss%3DValencia%26group_adults%3D2%26no_rooms%3D1%26selected_currency%3DCZK&sid=triply_web
 */

/** CJ (Commission Junction) click-tracking base for the Booking.com program. */
const CJ_BOOKING_CLICK_BASE =
  "https://www.tkqlhce.com/click-101732813-15735418";

/** Default CJ `sid` source tag used when a caller doesn't pass one. */
const DEFAULT_SID = "triply_web";

export interface BookingLinkParams {
  /** City / destination name searched on Booking.com, e.g. "Valencia". */
  destination: string;
  /** Number of adults in the room. Defaults to 2. */
  adults?: number;
  /**
   * Optional ISO currency code (e.g. "CZK"). When provided, added as
   * `selected_currency` to the inner Booking URL so the user's currency
   * selection carries through. Omit (or pass falsy) to let Booking default.
   */
  currency?: string;
  /** CJ `sid` source tag for click segmentation. Defaults to "triply_web". */
  source?: string;
}

/**
 * Build a CJ affiliate deep link to Booking.com search results for a
 * destination. See the file-level doc for the deep-link format.
 */
export function buildBookingAffiliateLink({
  destination,
  adults = 2,
  currency,
  source = DEFAULT_SID,
}: BookingLinkParams): string {
  // Inner Booking.com search URL. No checkin/checkout on purpose — Triply
  // doesn't capture exact dates, so Booking prompts the user for them.
  const params = new URLSearchParams({
    ss: destination,
    group_adults: String(adults),
    no_rooms: "1",
  });
  // selected_currency goes on the INNER Booking URL (before encoding) so
  // Booking — not CJ — reads it.
  if (currency) params.set("selected_currency", currency);
  const bookingUrl = `https://www.booking.com/searchresults.html?${params.toString()}`;

  // CJ deep link: the entire Booking URL is URL-encoded into the `url` param,
  // then the source tag is appended as `sid`.
  return `${CJ_BOOKING_CLICK_BASE}?url=${encodeURIComponent(bookingUrl)}&sid=${encodeURIComponent(source)}`;
}

/**
 * Whether the Booking.com CJ affiliate link is live / earning-capable. The CJ
 * deep link uses a static approved tracking URL (no API key or env var), so it
 * is always active once shipped — unlike the env-gated AWIN path in
 * `@/lib/affiliate`. Used to decide whether the commission disclosure renders.
 */
export function isBookingAffiliateActive(): boolean {
  return true;
}
