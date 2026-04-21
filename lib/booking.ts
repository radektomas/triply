import type { TripInput } from "@/lib/types";

const BOOKING_AFFILIATE_ID = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID;

export function bookingHotelUrl(city: string, country: string, input: TripInput): string {
  const params = new URLSearchParams({
    ss: `${city}, ${country}`,
    checkin: input.checkIn,
    checkout: input.checkOut,
    group_adults: String(input.travelers),
    no_rooms: "1",
    group_children: "0",
  });
  if (BOOKING_AFFILIATE_ID) params.set("aid", BOOKING_AFFILIATE_ID);
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

export function skyscannerFlightUrl(fromCity: string, toCity: string, input: TripInput): string {
  const depart = input.checkIn.replace(/-/g, "");
  const ret = input.checkOut.replace(/-/g, "");
  return `https://www.skyscanner.com/flights?adults=${input.travelers}&origin=${encodeURIComponent(fromCity)}&destination=${encodeURIComponent(toCity)}&depart=${depart}&return=${ret}`;
}

export function getYourGuideCityUrl(city: string): string {
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(city)}`;
}
