import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { theme } from "./theme";

export const runtime = "nodejs";

const MASCOT_POSES = [
  "pointing",
  "thumbs_up",
  "coconut",
  "wave",
  "shades",
  "shrug",
] as const;

type MascotPose = (typeof MASCOT_POSES)[number];
type SlideType = "cover" | "number" | "cta";

interface SlidePayload {
  type: SlideType;
  index: number;
  total: number;
  number: string | null;
  headline: string;
  speechBubble: string | null;
  mascotPose: MascotPose;
  bgImageB64: string;
}

function safe<T>(read: () => T): T | null {
  try {
    return read();
  } catch {
    return null;
  }
}

function toDataUrl(buf: Buffer | null): string | null {
  return buf ? `data:image/png;base64,${buf.toString("base64")}` : null;
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  ) as ArrayBuffer;
}

// Assets are read at module scope with literal paths so Vercel's file
// tracing bundles them into the function. Missing files resolve to null
// and are simply skipped at render time.
const antonRegular = safe(() =>
  fs.readFileSync(
    path.join(process.cwd(), "app/api/render-carousel/fonts/Anton-Regular.ttf")
  )
);
const interMedium = safe(() =>
  fs.readFileSync(
    path.join(process.cwd(), "app/api/render-carousel/fonts/Inter-Medium.ttf")
  )
);
const interBold = safe(() =>
  fs.readFileSync(
    path.join(process.cwd(), "app/api/render-carousel/fonts/Inter-Bold.ttf")
  )
);

const mascotSrc: Record<MascotPose, string | null> = {
  pointing: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/pointing.png")
      )
    )
  ),
  thumbs_up: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/thumbs_up.png")
      )
    )
  ),
  coconut: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/coconut.png")
      )
    )
  ),
  wave: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/wave.png")
      )
    )
  ),
  shades: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/shades.png")
      )
    )
  ),
  shrug: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/shrug.png")
      )
    )
  ),
};

// The mascot ships as 7 exported states (scripts/export-carousel-assets.mjs),
// not as the 6 n8n pose names. Pose-named files above win when present so
// bespoke pose art can be dropped in later; until then each pose falls back
// to the closest state PNG below.
const stateSrc = {
  idle: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/idle.png")
      )
    )
  ),
  happy: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/happy.png")
      )
    )
  ),
  sad: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/sad.png")
      )
    )
  ),
  smug: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/smug.png")
      )
    )
  ),
  sleepy: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/sleepy.png")
      )
    )
  ),
  sitting: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/sitting.png")
      )
    )
  ),
  lost: toDataUrl(
    safe(() =>
      fs.readFileSync(
        path.join(process.cwd(), "public/carousel/mascot/lost.png")
      )
    )
  ),
};

const POSE_FALLBACK: Record<MascotPose, keyof typeof stateSrc> = {
  pointing: "happy",
  thumbs_up: "smug",
  coconut: "idle",
  wave: "happy",
  shades: "smug",
  shrug: "lost",
};

function resolveMascot(pose: MascotPose): string | null {
  const fallback = POSE_FALLBACK[pose];
  return mascotSrc[pose] ?? (fallback ? stateSrc[fallback] : null) ?? null;
}

const logoSrc = toDataUrl(
  safe(() =>
    fs.readFileSync(path.join(process.cwd(), "public/carousel/logo.png"))
  )
);

type FontEntry = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 700;
  style: "normal";
};

const fonts: FontEntry[] = [];
if (antonRegular) {
  fonts.push({
    name: theme.fonts.headline,
    data: toArrayBuffer(antonRegular),
    weight: 400,
    style: "normal",
  });
}
if (interMedium) {
  fonts.push({
    name: theme.fonts.body,
    data: toArrayBuffer(interMedium),
    weight: 500,
    style: "normal",
  });
}
if (interBold) {
  fonts.push({
    name: theme.fonts.body,
    data: toArrayBuffer(interBold),
    weight: 700,
    style: "normal",
  });
}

const { colors, fonts: fontNames, canvas, sizes } = theme;

function BubbleTail() {
  return (
    <div style={{ display: "flex", position: "absolute", left: -18, bottom: 4 }}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30 2 C 30 16, 22 28, 4 36 C 17 38, 30 33, 37 22 L 37 2 Z"
          fill={colors.bubbleBg}
        />
      </svg>
    </div>
  );
}

function Logo() {
  if (!logoSrc) return null;
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        left: 0,
        right: 0,
        bottom: canvas.safePadding,
        justifyContent: "center",
      }}
    >
      <img src={logoSrc} style={{ width: sizes.logoWidth }} />
    </div>
  );
}

function NumberSlide(p: SlidePayload) {
  const mascot = resolveMascot(p.mascotPose);
  return (
    <div
      style={{
        width: canvas.width,
        height: canvas.height,
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.cream,
        padding: canvas.safePadding,
      }}
    >
      <div
        style={{
          display: "flex",
          color: colors.teal,
          fontFamily: fontNames.body,
          fontWeight: 700,
          fontSize: sizes.counter,
        }}
      >
        {`${p.index}/${p.total}`}
      </div>
      {p.number ? (
        <div
          style={{
            display: "flex",
            marginTop: 8,
            color: colors.orange,
            fontFamily: fontNames.headline,
            fontSize: sizes.bigNumber,
            lineHeight: 0.9,
          }}
        >
          {`${p.number}.`}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          marginTop: 20,
          color: colors.ink,
          fontFamily: fontNames.headline,
          fontSize: sizes.numberHeadline,
          lineHeight: 1.02,
        }}
      >
        {p.headline.toUpperCase()}
      </div>
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          alignItems: "flex-end",
        }}
      >
        {mascot ? <img src={mascot} style={{ height: sizes.mascotHeight }} /> : null}
        {p.speechBubble ? (
          <div
            style={{
              display: "flex",
              flexGrow: 1,
              flexShrink: 1,
              marginLeft: mascot ? 44 : 0,
              marginBottom: 90,
              position: "relative",
            }}
          >
            <BubbleTail />
            <div
              style={{
                display: "flex",
                flexShrink: 1,
                maxWidth: "100%",
                backgroundColor: colors.bubbleBg,
                borderRadius: 40,
                padding: "34px 42px",
                boxShadow: "0 16px 40px rgba(26, 26, 26, 0.14)",
                color: colors.ink,
                fontFamily: fontNames.body,
                fontWeight: 500,
                fontSize: sizes.bubbleText,
                lineHeight: 1.3,
              }}
            >
              {p.speechBubble}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CtaSlide(p: SlidePayload) {
  const mascot = resolveMascot(p.mascotPose);
  return (
    <div
      style={{
        width: canvas.width,
        height: canvas.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.cream,
        padding: canvas.safePadding,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          color: colors.ink,
          fontFamily: fontNames.headline,
          fontSize: sizes.ctaHeadline,
          lineHeight: 1.05,
          textAlign: "center",
          justifyContent: "center",
        }}
      >
        {p.headline.toUpperCase()}
      </div>
      {mascot ? (
        <img
          src={mascot}
          style={{ height: sizes.mascotHeight, marginTop: 56 }}
        />
      ) : null}
      <Logo />
    </div>
  );
}

function CoverSlide(p: SlidePayload) {
  const b64 = p.bgImageB64 || "";
  const bgSrc = b64
    ? b64.startsWith("data:")
      ? b64
      : `data:image/png;base64,${b64}`
    : null;
  return (
    <div
      style={{
        width: canvas.width,
        height: canvas.height,
        display: "flex",
        position: "relative",
        backgroundColor: colors.cream,
      }}
    >
      {bgSrc ? (
        <img
          src={bgSrc}
          width={canvas.width}
          height={canvas.height}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: canvas.width,
            height: canvas.height,
            objectFit: "cover",
          }}
        />
      ) : null}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 96,
          left: canvas.safePadding,
          right: canvas.safePadding,
          color: colors.white,
          fontFamily: fontNames.body,
          fontWeight: 700,
          fontSize: sizes.coverHeadline,
          lineHeight: 1.12,
          textShadow: "0 4px 28px rgba(0, 0, 0, 0.55)",
        }}
      >
        {p.headline}
      </div>
      <Logo />
    </div>
  );
}

export async function POST(req: Request) {
  const token = process.env.CAROUSEL_RENDER_TOKEN;
  const auth = req.headers.get("authorization");
  if (!token || auth !== `Bearer ${token}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: SlidePayload;
  try {
    payload = (await req.json()) as SlidePayload;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (
    !payload ||
    !["cover", "number", "cta"].includes(payload.type) ||
    typeof payload.headline !== "string"
  ) {
    return new Response("Invalid slide payload", { status: 400 });
  }

  const slide =
    payload.type === "cover"
      ? CoverSlide(payload)
      : payload.type === "cta"
        ? CtaSlide(payload)
        : NumberSlide(payload);

  return new ImageResponse(slide, {
    width: canvas.width,
    height: canvas.height,
    emoji: "twemoji",
    fonts: fonts.length > 0 ? fonts : undefined,
    headers: {
      "Content-Disposition": `inline; filename="slide_${payload.index}.png"`,
    },
  });
}
