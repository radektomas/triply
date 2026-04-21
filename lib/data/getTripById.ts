import { supabase } from "@/lib/supabase";
import type { APITripResponse, TripInput } from "@/lib/types";

export interface TripRecord {
  id: string;
  input: TripInput;
  result: APITripResponse;
  created_at: string;
}

export async function getTripById(tripId: string): Promise<TripRecord | null> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, input, result, created_at")
    .eq("id", tripId)
    .single();

  if (error || !data) {
    console.warn("[getTripById] trip not found:", tripId, error?.message);
    return null;
  }

  return data as TripRecord;
}
