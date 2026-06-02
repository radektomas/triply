/**
 * Curation aid for VibeSearch destination thumbnails.
 *
 * Reads every destination from `lib/vibeDestinations.ts`, queries Unsplash's
 * `/search/photos` endpoint for candidates, and prints them in a paste-ready
 * format. It does NOT mutate `vibeDestinations.ts` — the final selection is
 * a human call ("do NOT auto-pick blindly"). Run it, scan the output, paste
 * the chosen `image` blocks into the right entries.
 *
 * Prerequisites:
 *   - UNSPLASH_ACCESS_KEY in your env (free Demo key from
 *     https://unsplash.com/developers — Demo tier is 50 req/h, the script
 *     paces itself within that). Put it in .env.local and either export it
 *     into your shell or run the script with `--env-file=.env.local`.
 *
 * Usage (any of these works depending on your Node version):
 *   node --env-file=.env.local --experimental-strip-types scripts/fetchDestinationPhotos.ts
 *   npx tsx --env-file=.env.local scripts/fetchDestinationPhotos.ts
 *   npx tsc scripts/fetchDestinationPhotos.ts --target es2022 --module nodenext \
 *     --moduleResolution nodenext --outDir scripts/.compiled && \
 *     node --env-file=.env.local scripts/.compiled/fetchDestinationPhotos.js
 *
 * Tip: pipe to a file for easier scrolling:
 *   ... > scripts/.candidates.txt
 *
 * Output (per destination):
 *   ─── Lisbon, Portugal ───────────────────────────────────────────
 *   [1] https://images.unsplash.com/photo-XXXX  (4032×3024)
 *       by Jane Doe (https://unsplash.com/@janedoe)
 *       alt: "Yellow tram on a cobbled Lisbon street"
 *       paste:
 *         image: {
 *           url: "https://images.unsplash.com/photo-XXXX",
 *           alt: "Lisbon, Portugal",
 *           credit: { name: "Jane Doe", link: "https://unsplash.com/photos/AAA" },
 *         },
 *   [2] ...
 */

import { VIBE_DESTINATIONS } from "../lib/vibeDestinations";

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.error("UNSPLASH_ACCESS_KEY missing — see header comment.");
  process.exit(1);
}

const CANDIDATES_PER_DESTINATION = 5;
// Free Demo tier is 50 req/h. Stay generous — 90s between calls means
// ~40 req/h with margin to spare for retries.
const DELAY_MS = 90_000 / VIBE_DESTINATIONS.length > 1500
  ? 1500
  : Math.ceil(90_000 / VIBE_DESTINATIONS.length);

interface UnsplashPhoto {
  id: string;
  urls: { raw: string };
  width: number;
  height: number;
  alt_description: string | null;
  description: string | null;
  links: { html: string };
  user: { name: string; username: string; links: { html: string } };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

async function search(query: string): Promise<UnsplashPhoto[]> {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(CANDIDATES_PER_DESTINATION));
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
      "Accept-Version": "v1",
    },
  });
  if (!res.ok) {
    throw new Error(`Unsplash ${res.status} for "${query}": ${await res.text()}`);
  }
  const data = (await res.json()) as UnsplashSearchResponse;
  return data.results;
}

function divider(label: string) {
  const padded = ` ${label} `;
  const fill = "─".repeat(Math.max(0, 64 - padded.length));
  return `─── ${label} ${fill}`;
}

function pasteBlock(
  photo: UnsplashPhoto,
  altFallback: string,
): string {
  const altRaw = photo.alt_description?.trim() || photo.description?.trim() || "";
  const alt = altRaw || altFallback;
  return [
    "      image: {",
    `        url: "${photo.urls.raw}",`,
    `        alt: ${JSON.stringify(alt)},`,
    `        credit: { name: ${JSON.stringify(photo.user.name)}, link: "${photo.links.html}" },`,
    "      },",
  ].join("\n");
}

async function main() {
  console.log(`Curating ${VIBE_DESTINATIONS.length} destinations (≈${DELAY_MS}ms between calls)\n`);

  for (const dest of VIBE_DESTINATIONS) {
    const label = `${dest.city}, ${dest.country}${dest.kind === "region" ? " (region)" : ""}`;
    console.log(divider(label));

    if (dest.image) {
      console.log(`  already curated — skipping\n`);
      continue;
    }

    // Region entries: query by the region name alone tends to give better
    // landscape shots than "<region> <country>", which often duplicates.
    const query =
      dest.kind === "region" && dest.city !== dest.country
        ? `${dest.city} landscape`
        : `${dest.city} ${dest.country}`;

    try {
      const results = await search(query);
      if (results.length === 0) {
        console.log("  no results — try a different query manually\n");
      } else {
        results.forEach((photo, i) => {
          console.log(
            `  [${i + 1}] ${photo.urls.raw}  (${photo.width}×${photo.height})`,
          );
          console.log(
            `      by ${photo.user.name} (${photo.user.links.html})`,
          );
          const alt = photo.alt_description?.trim() || photo.description?.trim();
          if (alt) console.log(`      alt: ${JSON.stringify(alt)}`);
          console.log("      paste:");
          console.log(pasteBlock(photo, label));
          console.log();
        });
      }
    } catch (err) {
      console.log(`  ERROR: ${err instanceof Error ? err.message : String(err)}\n`);
    }

    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log("\nDone. Paste the chosen `image: {...}` blocks into the matching entries in lib/vibeDestinations.ts.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
