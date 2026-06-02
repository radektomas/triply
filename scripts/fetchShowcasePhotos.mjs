/**
 * Curation helper for BudgetShowcase photos. Reuses the same Pexels endpoint
 * + env var that lib/photos.ts uses (PEXELS_API_KEY) — no parallel client,
 * no new SDK. For each of the 9 hand-picked showcase destinations, queries
 * Pexels with a few angles (city+country, "<city> skyline", "<city> cityscape"),
 * filters out alt-texts that look like portraits of people, and prints
 * paste-ready ShowcasePhoto blocks to drop into lib/budgetShowcase.ts.
 *
 * Usage:
 *   node --env-file=.env.local scripts/fetchShowcasePhotos.mjs
 *
 * Output per destination: 1-3 best candidates (after portrait filter), each
 * with the Pexels photo id, dimensions, photographer credit, alt text, and
 * a paste-ready block.
 */

const ENTRIES = [
  // Tier €500
  { city: "Kraków", country: "Poland" },
  { city: "Budapest", country: "Hungary" },
  { city: "Valencia", country: "Spain" },
  // Tier €1000
  { city: "Lisbon", country: "Portugal" },
  { city: "Athens", country: "Greece" },
  { city: "Split", country: "Croatia" },
  // Tier €2000
  { city: "Tokyo", country: "Japan" },
  { city: "Reykjavík", country: "Iceland" },
  { city: "Cape Town", country: "South Africa" },
];

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error("PEXELS_API_KEY missing — try `node --env-file=.env.local scripts/fetchShowcasePhotos.mjs`");
  process.exit(1);
}

// Reject alts that read like people-photos. Cheap heuristic; not perfect.
const PORTRAIT_TOKENS = [
  "person", "people", "man", "woman", "women", "men",
  "boy", "girl", "child", "children", "kid", "kids",
  "portrait", "headshot", "model", "selfie", "couple",
  "family", "smiling", "posing", "standing",
];

function looksLikePortrait(alt) {
  const lower = (alt || "").toLowerCase();
  return PORTRAIT_TOKENS.some((tok) => new RegExp(`\\b${tok}\\b`).test(lower));
}

async function searchPexels(query, perPage = 5) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  const res = await fetch(url, {
    headers: { Authorization: API_KEY },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Pexels ${res.status} for "${query}"`);
  }
  const data = await res.json();
  return data.photos ?? [];
}

function divider(label) {
  const padded = ` ${label} `;
  const fill = "─".repeat(Math.max(0, 70 - padded.length - 4));
  return `\n─── ${label} ${fill}`;
}

function pasteBlock(p, fallbackAlt) {
  const alt = (p.alt || fallbackAlt).replace(/"/g, '\\"');
  return [
    "      photo: {",
    `        id: ${p.id},`,
    `        url: ${JSON.stringify(p.src.large)},`,
    `        urlLarge: ${JSON.stringify(p.src.large2x)},`,
    `        photographer: ${JSON.stringify(p.photographer)},`,
    `        photographerUrl: ${JSON.stringify(p.photographer_url)},`,
    `        alt: ${JSON.stringify(alt)},`,
    "      },",
  ].join("\n");
}

async function curateForEntry({ city, country }) {
  console.log(divider(`${city}, ${country}`));

  // Three angles. Skyline/cityscape biases toward landscape architecture
  // and away from human portraits. City + country is the broadest catch-all.
  const queries = [
    `${city} skyline`,
    `${city} cityscape`,
    `${city} ${country}`,
  ];

  const seen = new Set();
  const candidates = [];

  for (const q of queries) {
    let photos = [];
    try {
      photos = await searchPexels(q, 5);
    } catch (err) {
      console.log(`  query "${q}" failed: ${err.message}`);
      continue;
    }
    for (const p of photos) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      if (looksLikePortrait(p.alt)) continue;
      candidates.push({ ...p, _query: q });
      if (candidates.length >= 3) break;
    }
    if (candidates.length >= 3) break;
    // Small spacing to be polite to the API.
    await new Promise((r) => setTimeout(r, 300));
  }

  if (candidates.length === 0) {
    console.log("  (no non-portrait candidates — pick manually on pexels.com)");
    return;
  }

  candidates.forEach((p, i) => {
    console.log(
      `  [${i + 1}] id=${p.id}  ${p.width}×${p.height}  via "${p._query}"`,
    );
    console.log(`      by ${p.photographer}`);
    if (p.alt) console.log(`      alt: ${JSON.stringify(p.alt)}`);
    console.log(`      preview: ${p.src.medium}`);
    console.log("      paste:");
    console.log(pasteBlock(p, `${city}, ${country}`));
    console.log();
  });
}

async function main() {
  console.log(`Curating ${ENTRIES.length} showcase destinations\n`);
  for (const entry of ENTRIES) {
    await curateForEntry(entry);
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log("\nDone. Paste the chosen `photo: { ... }` block into the matching entry in lib/budgetShowcase.ts.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
