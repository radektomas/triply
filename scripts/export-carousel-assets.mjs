// Exports the Triply mascot (all 7 states) and the Wordmark logo to static
// transparent PNGs for the carousel render endpoint.
//
//   node scripts/export-carousel-assets.mjs   (or: npm run export:carousel)
//
// The mascot exists only as the procedural TSX component
// components/triply/TriplyMascot.tsx, so this script transpiles it on the
// fly with the project's TypeScript compiler, swaps framer-motion for a
// static shim (motion.* renders the plain element, useInView/useReducedMotion
// force the static base pose), renders each state to SVG markup with
// react-dom/server, and rasterizes it with sharp.
//
// The Wordmark is an HTML/Tailwind component, so it is rebuilt here as an
// equivalent SVG luggage tag (same colors, same geometry, hideString
// variant). The plane emoji is composited from the twemoji airplane, the
// same emoji set the render endpoint uses; if the one-time CDN fetch fails
// the logo is written without the plane.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ts = (await import(pathToFileURL(path.join(projectRoot, "node_modules/typescript/lib/typescript.js")).href)).default;
const sharp = (await import(pathToFileURL(path.join(projectRoot, "node_modules/sharp/lib/index.js")).href)).default;

const MASCOT_STATES = ["idle", "happy", "sad", "smug", "sleepy", "sitting", "lost"];
const MASCOT_HEIGHT = 1024;
const LOGO_WIDTH = 720;

const mascotDir = path.join(projectRoot, "public/carousel/mascot");
const logoPath = path.join(projectRoot, "public/carousel/logo.png");
const tmpDir = path.join(projectRoot, "scripts/.carousel-export-tmp");

const FRAMER_SHIM = `
import { createElement, forwardRef } from "react";

const MOTION_PROPS = new Set([
  "animate", "initial", "exit", "transition", "variants",
  "whileHover", "whileTap", "whileInView", "whileFocus", "whileDrag",
  "layout", "layoutId", "drag", "dragConstraints", "dragElastic",
  "onAnimationComplete", "onAnimationStart", "viewport",
]);

const cache = new Map();
function staticComponent(tag) {
  if (!cache.has(tag)) {
    cache.set(tag, forwardRef(function StaticMotion(props, ref) {
      const clean = {};
      for (const [key, value] of Object.entries(props)) {
        if (!MOTION_PROPS.has(key)) clean[key] = value;
      }
      return createElement(tag, { ...clean, ref });
    }));
  }
  return cache.get(tag);
}

export const motion = new Proxy({}, { get: (_target, tag) => staticComponent(tag) });
export const AnimatePresence = ({ children }) => children ?? null;
export const useInView = () => false;
export const useReducedMotion = () => true;
`;

function transpileComponent(relPath) {
  const source = fs.readFileSync(path.join(projectRoot, relPath), "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: relPath,
  });
  return result.outputText
    .replaceAll('from "framer-motion"', 'from "./framer-motion-shim.mjs"')
    .replaceAll('from "./TriplyBubble"', 'from "./TriplyBubble.mjs"');
}

function extractSvg(markup) {
  const match = markup.match(/<svg[\s\S]*?<\/svg>/);
  if (!match) throw new Error("No <svg> element found in rendered markup");
  // librsvg cannot resolve the system-ui alias, substitute a real face.
  // Explicit width/height replace the layout-driven 100% so sharp gets
  // concrete dimensions; the viewBox is 0 0 400 480.
  return match[0]
    .replace('width="100%" height="100%"', 'width="400" height="480"')
    .replaceAll('font-family="system-ui"', 'font-family="Helvetica, sans-serif"');
}

async function exportMascots() {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    fs.writeFileSync(path.join(tmpDir, "framer-motion-shim.mjs"), FRAMER_SHIM);
    fs.writeFileSync(
      path.join(tmpDir, "TriplyBubble.mjs"),
      transpileComponent("components/triply/TriplyBubble.tsx")
    );
    fs.writeFileSync(
      path.join(tmpDir, "TriplyMascot.mjs"),
      transpileComponent("components/triply/TriplyMascot.tsx")
    );

    const { TriplyMascot } = await import(pathToFileURL(path.join(tmpDir, "TriplyMascot.mjs")).href);
    const { createElement } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");

    for (const state of MASCOT_STATES) {
      const markup = renderToStaticMarkup(createElement(TriplyMascot, { state, size: "xl" }));
      const svg = extractSvg(markup);
      const outPath = path.join(mascotDir, `${state}.png`);
      // density 160 renders the 480 unit tall viewBox above 1024px, the
      // resize brings it to exactly 1024 tall with preserved aspect ratio.
      await sharp(Buffer.from(svg), { density: 160 })
        .resize({ height: MASCOT_HEIGHT })
        .png()
        .toFile(outPath);
      console.log(`wrote ${path.relative(projectRoot, outPath)}`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// SVG rebuild of components/ui/Wordmark.tsx (lg, hideString): teal luggage
// tag, cream perforation dots on the left/right edges, bold italic
// tracking-tight wordmark with coral "t" and cream "riply", plane emoji
// after the text. Colors are copied from the component.
const TAG_GREEN = "#0D7377";
const CREAM = "#FFE4CC";
const CORAL = "#FF6B47";

async function fetchTwemojiPlane() {
  try {
    const res = await fetch("https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/2708.svg");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.warn(`twemoji fetch failed (${err.message}), logo will be written without the plane`);
    return null;
  }
}

async function exportLogo() {
  // Geometry in a 330x136 design space: rounded-xl tag, px-10 py-5 padding
  // around a 64px wordmark, w-5 perforations centered on the side edges.
  // The tag hugs its content like the component does: text ends near x=225,
  // the plane spans 232..276, then px-10 padding to the right edge at 320.
  const W = 330;
  const H = 136;
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="10" y="0" width="${W - 20}" height="${H}" rx="16" fill="${TAG_GREEN}"/>
  <circle cx="10" cy="${H / 2}" r="13" fill="${CREAM}"/>
  <circle cx="${W - 10}" cy="${H / 2}" r="13" fill="${CREAM}"/>
  <text x="52" y="${H / 2 + 23}" font-size="64" font-weight="bold" font-style="italic" letter-spacing="-1.6" font-family="Helvetica, sans-serif"><tspan fill="${CORAL}">t</tspan><tspan fill="${CREAM}">riply</tspan></text>
</svg>`;

  const scale = LOGO_WIDTH / W;
  const base = await sharp(Buffer.from(logoSvg), { density: Math.ceil(72 * scale) })
    .resize({ width: LOGO_WIDTH })
    .png()
    .toBuffer();

  const twemoji = await fetchTwemojiPlane();
  let out = sharp(base);
  if (twemoji) {
    const planeSize = Math.round(44 * scale);
    const plane = await sharp(twemoji, { density: 300 })
      .resize({ width: planeSize, height: planeSize, fit: "contain" })
      .png()
      .toBuffer();
    // Sits right of the wordmark (ml-2 in the component), vertically centered.
    out = out.composite([
      {
        input: plane,
        left: Math.round(232 * scale),
        top: Math.round((H / 2) * scale - planeSize / 2),
      },
    ]);
  }
  await out.png().toFile(logoPath);
  console.log(`wrote ${path.relative(projectRoot, logoPath)}`);
}

fs.mkdirSync(mascotDir, { recursive: true });
await exportMascots();
await exportLogo();

for (const file of [...MASCOT_STATES.map((s) => path.join(mascotDir, `${s}.png`)), logoPath]) {
  const meta = await sharp(file).metadata();
  console.log(`${path.relative(projectRoot, file)}: ${meta.width}x${meta.height}`);
}
