// Approximate city-center coords — fallback when n8n doesn't return per-item locations

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // Central / Eastern Europe
  berlin: { lat: 52.52, lng: 13.405 },
  budapest: { lat: 47.4979, lng: 19.0402 },
  prague: { lat: 50.0755, lng: 14.4378 },
  vienna: { lat: 48.2082, lng: 16.3738 },
  krakow: { lat: 50.0647, lng: 19.945 },
  warsaw: { lat: 52.2297, lng: 21.0122 },
  bratislava: { lat: 48.1486, lng: 17.1077 },
  ljubljana: { lat: 46.0569, lng: 14.5058 },
  zagreb: { lat: 45.815, lng: 15.9819 },
  belgrade: { lat: 44.7866, lng: 20.4489 },
  bucharest: { lat: 44.4268, lng: 26.1025 },
  sofia: { lat: 42.6977, lng: 23.3219 },
  tallinn: { lat: 59.437, lng: 24.7536 },
  riga: { lat: 56.9496, lng: 24.1052 },
  vilnius: { lat: 54.6872, lng: 25.2797 },

  // Western Europe
  london: { lat: 51.5074, lng: -0.1278 },
  paris: { lat: 48.8566, lng: 2.3522 },
  amsterdam: { lat: 52.3676, lng: 4.9041 },
  brussels: { lat: 50.8503, lng: 4.3517 },
  dublin: { lat: 53.3498, lng: -6.2603 },
  edinburgh: { lat: 55.9533, lng: -3.1883 },
  copenhagen: { lat: 55.6761, lng: 12.5683 },
  stockholm: { lat: 59.3293, lng: 18.0686 },
  oslo: { lat: 59.9139, lng: 10.7522 },
  helsinki: { lat: 60.1699, lng: 24.9384 },
  reykjavik: { lat: 64.1466, lng: -21.9426 },

  // Southern Europe
  lisbon: { lat: 38.7223, lng: -9.1393 },
  porto: { lat: 41.1579, lng: -8.6291 },
  algarve: { lat: 37.0194, lng: -7.9304 },
  faro: { lat: 37.0194, lng: -7.9304 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  barcelona: { lat: 41.3851, lng: 2.1734 },
  seville: { lat: 37.3891, lng: -5.9845 },
  valencia: { lat: 39.4699, lng: -0.3763 },
  malaga: { lat: 36.7213, lng: -4.4213 },
  granada: { lat: 37.1773, lng: -3.5986 },
  rome: { lat: 41.9028, lng: 12.4964 },
  milan: { lat: 45.4642, lng: 9.19 },
  florence: { lat: 43.7696, lng: 11.2558 },
  venice: { lat: 45.4408, lng: 12.3155 },
  naples: { lat: 40.8518, lng: 14.2681 },
  athens: { lat: 37.9838, lng: 23.7275 },
  thessaloniki: { lat: 40.6401, lng: 22.9444 },
  santorini: { lat: 36.3932, lng: 25.4615 },
  mykonos: { lat: 37.4467, lng: 25.3289 },
  crete: { lat: 35.2401, lng: 24.8093 },

  // Germany / Switzerland / Austria
  munich: { lat: 48.1351, lng: 11.582 },
  hamburg: { lat: 53.5511, lng: 9.9937 },
  frankfurt: { lat: 50.1109, lng: 8.6821 },
  cologne: { lat: 50.9375, lng: 6.9603 },
  zurich: { lat: 47.3769, lng: 8.5417 },
  geneva: { lat: 46.2044, lng: 6.1432 },
  salzburg: { lat: 47.8095, lng: 13.055 },
  innsbruck: { lat: 47.2692, lng: 11.4041 },

  // France regional
  nice: { lat: 43.7102, lng: 7.262 },
  marseille: { lat: 43.2965, lng: 5.3698 },
  lyon: { lat: 45.764, lng: 4.8357 },
  bordeaux: { lat: 44.8378, lng: -0.5792 },

  // UK / Ireland regional
  manchester: { lat: 53.4808, lng: -2.2426 },
  liverpool: { lat: 53.4084, lng: -2.9916 },
  glasgow: { lat: 55.8642, lng: -4.2518 },
  cork: { lat: 51.8985, lng: -8.4756 },

  // Adriatic
  split: { lat: 43.5081, lng: 16.4402 },
  dubrovnik: { lat: 42.6507, lng: 18.0944 },
  kotor: { lat: 42.4247, lng: 18.7712 },
  budva: { lat: 42.2864, lng: 18.84 },

  // Turkey
  istanbul: { lat: 41.0082, lng: 28.9784 },
  antalya: { lat: 36.8969, lng: 30.7133 },
};

export function getCityCoords(destination: string): { lat: number; lng: number } | null {
  if (!destination) return null;
  const key = destination.toLowerCase().split(/[,\s]/)[0];
  return CITY_COORDS[key] ?? null;
}

// Spread N points in a pentagon/circle pattern ~1.2 km around a center
export function spreadAroundCenter(
  center: { lat: number; lng: number },
  count: number
): Array<{ lat: number; lng: number }> {
  const radiusKm = 1.2;
  const latOffset = radiusKm / 111;
  const lngOffset = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));

  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    return {
      lat: center.lat + latOffset * Math.sin(angle),
      lng: center.lng + lngOffset * Math.cos(angle),
    };
  });
}
