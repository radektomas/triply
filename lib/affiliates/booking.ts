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
 * Triply's form captures concrete calendar dates (a range picker → checkIn /
 * checkOut as YYYY-MM-DD). When supplied, those are set as `checkin`/`checkout`
 * on the INNER Booking URL (before encoding) so Booking lands on the user's
 * actual dates instead of prompting. Likewise a `currency` is added as
 * `selected_currency`. The destination (`ss`) and adult count (`group_adults`)
 * are always passed. All of these live on the inner Booking URL — never on the
 * outer CJ (tkqlhce.com) URL, which would ignore them.
 *
 * @example
 * buildBookingAffiliateLink({ destination: "Valencia" });
 * // https://www.tkqlhce.com/click-101732813-15735418?url=https%3A%2F%2Fwww.booking.com%2Fsearchresults.html%3Fss%3DValencia%26group_adults%3D2%26no_rooms%3D1&sid=triply_web
 *
 * @example
 * buildBookingAffiliateLink({
 *   destination: "Valencia",
 *   checkIn: "2026-07-10",
 *   checkOut: "2026-07-14",
 *   currency: "CZK",
 * });
 * // ...url=...%3Fss%3DValencia%26group_adults%3D2%26no_rooms%3D1%26checkin%3D2026-07-10%26checkout%3D2026-07-14%26selected_currency%3DCZK&sid=triply_web
 */

/** CJ (Commission Junction) click-tracking base for the Booking.com program. */
const CJ_BOOKING_CLICK_BASE =
  "https://www.tkqlhce.com/click-101732813-15735418";

/** Default CJ `sid` source tag used when a caller doesn't pass one. */
const DEFAULT_SID = "triply_web";

/** Strict YYYY-MM-DD shape check, used to gate date params. */
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
function isYmd(value: string | undefined): value is string {
  return typeof value === "string" && YMD_RE.test(value);
}

export interface BookingLinkParams {
  /** City / destination name searched on Booking.com, e.g. "Valencia". */
  destination: string;
  /** Number of adults in the room. Defaults to 2. */
  adults?: number;
  /**
   * Optional check-in date, YYYY-MM-DD. When a well-formed value is supplied
   * it's set as `checkin` on the inner Booking URL so Booking lands on the
   * user's chosen date. Malformed/missing values are omitted (no empty param).
   */
  checkIn?: string;
  /** Optional check-out date, YYYY-MM-DD. Same handling as {@link checkIn}. */
  checkOut?: string;
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
  checkIn,
  checkOut,
  currency,
  source = DEFAULT_SID,
}: BookingLinkParams): string {
  // Inner Booking.com search URL.
  const params = new URLSearchParams({
    ss: destination,
    group_adults: String(adults),
    no_rooms: "1",
  });
  // checkin/checkout, selected_currency all go on the INNER Booking URL
  // (before encoding) so Booking — not CJ — reads them. Dates are only set
  // when well-formed YYYY-MM-DD so we never emit an empty `checkin=`.
  if (isYmd(checkIn)) params.set("checkin", checkIn);
  if (isYmd(checkOut)) params.set("checkout", checkOut);
  if (currency) params.set("selected_currency", currency);
  const bookingUrl = `https://www.booking.com/searchresults.html?${params.toString()}`;

  // CJ deep link: the entire Booking URL is URL-encoded into the `url` param,
  // then the source tag is appended as `sid`.
  return `${CJ_BOOKING_CLICK_BASE}?url=${encodeURIComponent(bookingUrl)}&sid=${encodeURIComponent(source)}`;
}

/**
 * Whether the Booking.com CJ affiliate link is live / earning-capable. The CJ
 * deep link uses a static approved tracking URL (no API key or env var), so it
 * is always active once shipped. Used to decide whether the commission
 * disclosure renders (see components/shared/AffiliateDisclosure.tsx).
 */
export function isBookingAffiliateActive(): boolean {
  return true;
}
