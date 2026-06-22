import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTripById } from "@/lib/data/getTripById";
import { adaptAPIDestination } from "@/lib/data/getTripDetail";
import { computeNights } from "@/lib/dates";
import { checkGenerationLimit } from "@/lib/generationLimits";
import { DestinationSelector } from "@/components/trip/DestinationSelector";
import { TripDetailView } from "@/components/trip/TripDetailView";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ d?: string }>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { id } = await params;
  const { d: destId } = await searchParams;
  const trip = await getTripById(id);
  if (!trip) return { title: "Trip — Triply" };

  const { budget, checkIn, checkOut } = trip.input;
  const nights = computeNights(checkIn, checkOut);
  const month = new Date(checkIn).toLocaleString("en-US", { month: "long" });

  // If a specific destination is being viewed, use it for the metadata; the
  // OG image route only sees `params.id` so the picture defaults to the first
  // destination — slight mismatch but acceptable for share previews.
  const dest =
    (destId && trip.result?.destinations?.find((d) => d.id === destId)) ||
    trip.result?.destinations?.[0];

  if (!dest) {
    return {
      title: `Your trip · €${budget} · ${nights} nights in ${month} — Triply`,
      description: `AI-curated trips for €${budget}, ${nights} nights in ${month}.`,
    };
  }

  const title = `${dest.name}, ${dest.country} · €${budget} · ${nights} nights — Triply`;
  const description = `${nights} ${nights === 1 ? "night" : "nights"} in ${dest.name}, ${dest.country} for €${budget} — AI-curated by Triply.`;
  const canonical = `/trip/${id}${destId ? `?d=${destId}` : ""}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "Triply",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id: tripId } = await params;
  const { d: destId } = await searchParams;

  const trip = await getTripById(tripId);
  if (!trip) notFound();

  // No destination chosen → show 3-card selector. The selector's "Generate 3
  // more" control needs the user's daily limit, computed server-side so the
  // logged-in state is correct at first paint (no button-then-upsell flash).
  if (!destId) {
    const limitStatus = await checkGenerationLimit();
    return <DestinationSelector trip={trip} limitStatus={limitStatus} />;
  }

  const dest = trip.result?.destinations?.find((d) => d.id === destId);
  if (!dest) {
    const limitStatus = await checkGenerationLimit();
    return <DestinationSelector trip={trip} limitStatus={limitStatus} />;
  }

  const detail = adaptAPIDestination(dest, trip.input);
  // True one-destination trips have no useful selector page to fall back
  // to — Back goes to landing instead. A `specific` mode that returned
  // multiple destinations (region like "Sardinia") still has a usable
  // selector, so we key purely off the array length.
  const isSingleDestinationTrip =
    (trip.result?.destinations?.length ?? 0) <= 1;
  return (
    <TripDetailView
      detail={detail}
      tips={dest.tips ?? []}
      confidence={dest.confidence}
      disclaimer={dest.disclaimer}
      returnUrl={isSingleDestinationTrip ? "/" : `/trip/${tripId}`}
      returnLabel={isSingleDestinationTrip ? "Back to Triply" : undefined}
      destination={dest}
      tripId={tripId}
      tripInput={trip.input}
    />
  );
}
