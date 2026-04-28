import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TripDetailView } from "@/components/trip/TripDetailView";
import { EXAMPLE_TRIPS } from "@/lib/data/exampleTrips";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const example = EXAMPLE_TRIPS[slug];
  if (!example) return { title: "Example trip — Triply" };
  const { detail } = example;
  return {
    title: `${detail.destination}, ${detail.country} · €${detail.budget.total} · ${detail.nights} nights — example trip`,
    description: detail.description,
  };
}

export default async function ExamplePage({ params }: { params: Params }) {
  const { slug } = await params;
  const example = EXAMPLE_TRIPS[slug];
  if (!example) notFound();

  return (
    <TripDetailView
      detail={example.detail}
      tips={example.tips}
      confidence="high"
      returnUrl="/"
      returnLabel="Back to home"
    />
  );
}
