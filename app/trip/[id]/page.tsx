import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTripById } from "@/lib/data/getTripById";
import { adaptAPIDestination } from "@/lib/data/getTripDetail";
import { computeNights } from "@/lib/dates";
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

  // No destination chosen → show 3-card selector
  if (!destId) {
    return <DestinationSelector trip={trip} />;
  }

  const dest = trip.result?.destinations?.find((d) => d.id === destId);
  if (!dest) {
    return <DestinationSelector trip={trip} />;
  }

  const detail = adaptAPIDestination(dest, trip.input);
  return (
    <TripDetailView
      detail={detail}
      tips={dest.tips ?? []}
      confidence={dest.confidence}
      disclaimer={dest.disclaimer}
      returnUrl={`/trip/${tripId}`}
    />
  );
}
