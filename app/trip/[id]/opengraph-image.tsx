import { ImageResponse } from "next/og";
import { getTripById } from "@/lib/data/getTripById";
import { getCityPhoto } from "@/lib/photos";
import { computeNights } from "@/lib/dates";
import { getGradient } from "@/lib/utils/gradient";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Note: Open Graph image routes only receive `params`, not `searchParams`. The
// trip URL has the chosen destination in `?d=<destId>` which we cannot read
// here. We therefore generate one canonical OG image per trip ID using the
// FIRST destination as the representative for previews.
export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getTripById(id);
  const dest = trip?.result?.destinations?.[0];

  // Fallback when the trip can't be loaded — branded placeholder using the
  // gradient derived from the trip id.
  if (!trip || !dest) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: getGradient(id),
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: "system-ui, sans-serif",
            color: "white",
            padding: 72,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              fontStyle: "italic",
              letterSpacing: -1,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ color: "#FF6B47" }}>t</span>
            <span style={{ color: "#FFE4CC" }}>riply</span>
            <span style={{ fontStyle: "normal" }}>✈️</span>
          </div>
          <div style={{ marginTop: 24, fontSize: 32, opacity: 0.9, display: "flex" }}>
            Plan your trip →
          </div>
        </div>
      ),
      { ...size },
    );
  }

  const photoUrl = await getCityPhoto(dest.name, dest.country);
  const { budget, checkIn, checkOut } = trip.input;
  const nights = computeNights(checkIn, checkOut);
  const fallbackGradient = getGradient(dest.id);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
          background: fallbackGradient,
        }}
      >
        {/* Hero image — Pexels photo of the destination, edge-to-edge */}
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}

        {/* Dark gradient overlay for text legibility */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.85) 100%)",
            display: "flex",
          }}
        />

        {/* Content layer */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px 72px",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Top: Triply wordmark in its native teal pill */}
          <div style={{ display: "flex" }}>
            <div
              style={{
                backgroundColor: "#0D7377",
                padding: "12px 24px",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 36,
                fontWeight: 800,
                fontStyle: "italic",
                letterSpacing: -1,
                boxShadow: "0 8px 28px rgba(13,115,119,0.35)",
              }}
            >
              <span style={{ color: "#FF6B47" }}>t</span>
              <span style={{ color: "#FFE4CC" }}>riply</span>
              <span style={{ fontStyle: "normal", marginLeft: 4 }}>✈️</span>
            </div>
          </div>

          {/* Middle: country eyebrow + destination name + budget/nights */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <span
              style={{
                color: "rgba(255,255,255,0.78)",
                fontSize: 24,
                letterSpacing: 5,
                textTransform: "uppercase",
                fontWeight: 700,
                display: "flex",
              }}
            >
              {dest.country}
            </span>
            <span
              style={{
                color: "white",
                fontSize: 124,
                fontWeight: 800,
                letterSpacing: -3,
                lineHeight: 0.95,
                display: "flex",
                textShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              {dest.name}
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.92)",
                fontSize: 40,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 6,
              }}
            >
              <span>€{budget}</span>
              <span style={{ color: "rgba(255,255,255,0.45)" }}>·</span>
              <span>
                {nights} {nights === 1 ? "night" : "nights"}
              </span>
            </span>
          </div>

          {/* Bottom: tagline + domain */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <span style={{ fontSize: 26, color: "rgba(255,255,255,0.78)", display: "flex" }}>
              Plan your trip →
            </span>
            <span style={{ fontSize: 22, color: "rgba(255,255,255,0.55)", display: "flex" }}>
              flytriply.eu
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
