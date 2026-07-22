import { isBookingAffiliateActive } from "@/lib/affiliates/booking";
import { isGygAffiliateActive } from "@/lib/gyg";

// Affiliate commission disclosure.
//
// Renders NOTHING unless the named partner is actually earning. That is the
// whole point: GetYourGuide links are currently gated on a PENDING partner id
// and go out unaffiliated, so a disclosure next to them would claim a
// commercial relationship that does not exist — the same species of untrue
// claim as advertising model-generated figures as "real prices". When a
// partner id lands in the environment, the disclosure appears on its own.
//
// Booking.com goes through CJ (Commission Junction) on a static approved
// tracking URL, so it is always earning once shipped.

export type AffiliatePartner = "booking" | "gyg";

function isPartnerEarning(partner: AffiliatePartner): boolean {
  return partner === "booking" ? isBookingAffiliateActive() : isGygAffiliateActive();
}

/** Small "link" glyph, matching the hand-rolled SVG style of VibeIcons.tsx. */
function AffiliateLinkIcon({ size = 12, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M13 19 L19 13"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M17 9 L20 6 A5.5 5.5 0 0 1 26 12 L23 15"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M15 23 L12 26 A5.5 5.5 0 0 1 6 20 L9 17"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

interface Props {
  /**
   * Which partner this surface links to. The disclosure is suppressed entirely
   * when that partner is not currently earning a commission.
   */
  partner: AffiliatePartner;
  /**
   * `inline` — a single quiet line, for sitting directly under a link.
   * `block`  — a bordered note, for a section that contains several links.
   */
  variant?: "inline" | "block";
  className?: string;
}

const PARTNER_LABEL: Record<AffiliatePartner, string> = {
  booking: "Booking.com",
  gyg: "GetYourGuide",
};

export function AffiliateDisclosure({ partner, variant = "inline", className = "" }: Props) {
  if (!isPartnerEarning(partner)) return null;

  const label = PARTNER_LABEL[partner];

  if (variant === "inline") {
    return (
      <p
        className={`flex items-start gap-1.5 text-[11px] leading-snug text-muted/80 ${className}`}
      >
        <span className="mt-[2px]">
          <AffiliateLinkIcon />
        </span>
        <span>
          Partner link. We may earn a commission if you book on {label} — you pay nothing extra.
        </span>
      </p>
    );
  }

  return (
    <div
      className={`flex items-start gap-2 rounded-xl border border-border bg-white/60 px-3 py-2.5 text-[11px] leading-snug text-muted ${className}`}
    >
      <span className="mt-[2px]">
        <AffiliateLinkIcon size={13} />
      </span>
      <span>
        Some links here are partner links. If you book on {label} after clicking one, Triply may earn
        a commission at no extra cost to you. It never changes the price you pay, and it plays no
        part in which destinations we recommend.
      </span>
    </div>
  );
}
