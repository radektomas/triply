"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { supabase as serviceSupabase } from "@/lib/supabase";

// Server Actions are reachable via direct POST, not just from the page, so
// every action re-runs the same ADMIN_EMAILS allowlist guard as the page
// itself (404 for anyone else — the route never reveals it exists).
async function requireAdmin(): Promise<void> {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const email = user?.email?.toLowerCase();
  if (!email || !allowlist.includes(email)) {
    notFound();
  }
}

async function setIdeaStatus(
  formData: FormData,
  status: "picked" | "discarded" | "posted",
): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing idea id");

  const { error } = await serviceSupabase
    .from("content_ideas")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(`Failed to mark idea ${status}: ${error.message}`);

  revalidatePath("/admin/content");
}

export async function pickIdea(formData: FormData): Promise<void> {
  await setIdeaStatus(formData, "picked");
}

export async function discardIdea(formData: FormData): Promise<void> {
  await setIdeaStatus(formData, "discarded");
}

export async function markPosted(formData: FormData): Promise<void> {
  await setIdeaStatus(formData, "posted");
}

// Optional numeric field: empty string → null, anything unparseable → null
// rather than a thrown error, so a partially filled results form still logs.
function intOrNull(formData: FormData, name: string): number | null {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function logResult(formData: FormData): Promise<void> {
  await requireAdmin();

  const ideaId = String(formData.get("idea_id") ?? "");
  const platform = String(formData.get("platform") ?? "");
  if (!ideaId) throw new Error("Missing idea id");
  if (platform !== "reels" && platform !== "tiktok") {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const notes = String(formData.get("notes") ?? "").trim();
  const { error } = await serviceSupabase.from("content_results").insert({
    idea_id: ideaId,
    platform,
    views: intOrNull(formData, "views"),
    saves: intOrNull(formData, "saves"),
    comments: intOrNull(formData, "comments"),
    profile_visits: intOrNull(formData, "profile_visits"),
    notes: notes || null,
  });
  if (error) throw new Error(`Failed to log result: ${error.message}`);

  revalidatePath("/admin/content");
}
