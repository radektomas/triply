import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Triply — €300? I'll find you a trip.";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #FFE4CC 0%, #FFD4B8 60%, #FFC9A8 100%)",
          padding: "56px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Top-right: boarding pass flavor */}
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 4,
              color: "#0D7377",
              opacity: 0.55,
              fontWeight: 700,
              display: "flex",
            }}
          >
            BOARDING · 001
          </div>
          <div
            style={{
              width: 110,
              height: 0,
              borderTop: "1.5px dashed rgba(13,115,119,0.3)",
              display: "flex",
            }}
          />
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* Wordmark row */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              lineHeight: 1,
            }}
          >
            <div
              style={{
                fontSize: 148,
                fontWeight: 800,
                fontStyle: "italic",
                letterSpacing: -5,
                color: "#FF6B47",
                display: "flex",
                lineHeight: 1,
              }}
            >
              t
            </div>
            <div
              style={{
                fontSize: 148,
                fontWeight: 800,
                fontStyle: "italic",
                letterSpacing: -5,
                color: "#0D7377",
                display: "flex",
                lineHeight: 1,
              }}
            >
              riply
            </div>
            <div
              style={{
                fontSize: 80,
                marginLeft: 18,
                display: "flex",
                lineHeight: 1,
              }}
            >
              ✈️
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 54,
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: -1.5,
              lineHeight: 1.15,
              display: "flex",
            }}
          >
            €300? I'll find you a trip.
          </div>

          {/* Sub-tagline */}
          <div
            style={{
              fontSize: 28,
              color: "#6B7280",
              fontWeight: 400,
              display: "flex",
            }}
          >
            AI trip planner for European budget travel
          </div>
        </div>

        {/* Bottom: domain */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#0D7377",
              fontWeight: 600,
              letterSpacing: 1,
              opacity: 0.65,
              display: "flex",
            }}
          >
            flytriply.eu
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
