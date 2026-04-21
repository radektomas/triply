import { ImageResponse } from "next/og";
import { getGradient } from "@/lib/utils/gradient";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function readableNameFromId(id: string): string {
  return id
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function abbreviationFromId(id: string): string {
  return id.split("-")[0].slice(0, 2).toUpperCase();
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const name = readableNameFromId(id);
  const abbr = abbreviationFromId(id);
  const gradient = getGradient(id);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: gradient,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Top row: plane icon + abbreviation badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 64, display: "flex" }}>✈️</span>
          <span
            style={{
              background: "rgba(255,255,255,0.18)",
              color: "white",
              fontSize: 28,
              fontWeight: 800,
              padding: "8px 22px",
              borderRadius: 999,
              letterSpacing: 3,
              display: "flex",
            }}
          >
            {abbr}
          </span>
        </div>

        {/* Center: destination name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: "white",
              letterSpacing: -3,
              lineHeight: 1.05,
              display: "flex",
            }}
          >
            {name}
          </div>
        </div>

        {/* Bottom: tagline + branding */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ fontSize: 28, color: "rgba(255,255,255,0.80)", display: "flex" }}>
            Plan your trip →
          </span>
          <span style={{ fontSize: 20, color: "rgba(255,255,255,0.45)", display: "flex" }}>
            triply · flytriply.eu
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
