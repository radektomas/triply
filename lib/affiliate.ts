const AWIN_AFFILIATE_ID = process.env.NEXT_PUBLIC_AWIN_AFFILIATE_ID;
const AWIN_BOOKING_MERCHANT_ID = process.env.NEXT_PUBLIC_AWIN_BOOKING_MERCHANT_ID;

export function wrapBookingUrl(directUrl: string): string {
  if (!AWIN_AFFILIATE_ID || !AWIN_BOOKING_MERCHANT_ID) {
    return directUrl;
  }
  const encoded = encodeURIComponent(directUrl);
  return `https://www.awin1.com/cread.php?awinmid=${AWIN_BOOKING_MERCHANT_ID}&awinaffid=${AWIN_AFFILIATE_ID}&ued=${encoded}`;
}

export function isAffiliateActive(): boolean {
  return Boolean(AWIN_AFFILIATE_ID && AWIN_BOOKING_MERCHANT_ID);
}
