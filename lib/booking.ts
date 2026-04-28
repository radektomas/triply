import { wrapBookingUrl } from "./affiliate";

interface BookingHotelParams {
  city: string;
  country: string;
  checkIn?: string;
  checkOut?: string;
  travelers?: number;
  maxNightlyPrice?: number;
}

export function bookingHotelUrl(params: BookingHotelParams): string {
  const qs = new URLSearchParams({ ss: `${params.city}, ${params.country}` });
  if (params.checkIn) qs.set("checkin", params.checkIn);
  if (params.checkOut) qs.set("checkout", params.checkOut);
  if (params.travelers && params.travelers > 0) {
    qs.set("group_adults", String(params.travelers));
    qs.set("no_rooms", params.travelers >= 4 ? "2" : "1");
    qs.set("group_children", "0");
  }
  if (
    typeof params.maxNightlyPrice === "number" &&
    Number.isFinite(params.maxNightlyPrice) &&
    params.maxNightlyPrice > 0
  ) {
    qs.set("nflt", `price=EUR-min-${Math.round(params.maxNightlyPrice)}-1`);
  }
  return wrapBookingUrl(`https://www.booking.com/searchresults.html?${qs.toString()}`);
}

export function skyscannerFlightUrl(
  fromCity: string,
  toCity: string,
  checkIn?: string,
  checkOut?: string,
  travelers?: number
): string {
  const qs = new URLSearchParams({ adults: String(travelers || 1) });
  let url = `https://www.skyscanner.com/flights?${qs.toString()}&from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}`;
  if (checkIn) url += `&depart=${checkIn}`;
  if (checkOut) url += `&return=${checkOut}`;
  return url;
}

export function getYourGuideUrl(city: string): string {
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(city)}`;
}
