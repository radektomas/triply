export function travelersLabel(count: number): string {
  if (count === 1) return "solo";
  if (count === 2) return "couple";
  if (count >= 3 && count <= 4) return "family";
  return "group";
}

export function travelersFlavor(count: number): string {
  if (count === 1)
    return "flexible solo traveler, any vibe";
  if (count === 2)
    return "couple — prioritize romantic spots, sunset viewpoints, intimate dining, couples-friendly activities";
  if (count >= 3 && count <= 4)
    return "family with kids — prioritize kid-friendly activities, family hotels with pools, parks, safe neighborhoods, avoid crazy nightlife";
  return "group of friends — prioritize social venues, group-friendly activities, lively nightlife, shared apartment options over single hotel rooms";
}
