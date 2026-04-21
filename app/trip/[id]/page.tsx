import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTripById } from "@/lib/data/getTripById";
import { adaptAPIDestination } from "@/lib/data/getTripDetail";
import { DestinationSelector } from "@/components/trip/DestinationSelector";
import { TripDetailView } from "@/components/trip/TripDetailView";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ d?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const trip = await getTripById(id);
  if (!trip) return { title: "Trip — AI Trip Planner" };

  const { budget, checkIn, checkOut } = trip.input;
  const nights = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
  const month = new Date(checkIn).toLocaleString("en-US", { month: "long" });
  return {
    title: `Your trips · €${budget} · ${nights} nights in ${month} — AI Trip Planner`,
    description: `3 AI-curated destinations for €${budget}, ${nights} nights in ${month}.`,
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

  const dest = trip.result.destinations.find((d) => d.id === destId);
  if (!dest) {
    return <DestinationSelector trip={trip} />;
  }

  const detail = adaptAPIDestination(dest, trip.input);
  return <TripDetailView detail={detail} dest={dest} tripId={tripId} />;
}
