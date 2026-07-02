import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Triply apple-touch icon: the same boarding-pass mark as app/icon.svg, drawn
// at 180×180 — coral ticket on cream, slight tilt, perforation notches +
// dashed tear line. Kept as ImageResponse (PNG) because iOS ignores SVG icons.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#FFE4CC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 130,
            height: 79,
            background: "#FF6B47",
            borderRadius: 18,
            transform: "rotate(-10deg)",
            display: "flex",
          }}
        >
          {/* dashed tear line at the stub */}
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 16,
              bottom: 16,
              width: 0,
              borderLeft: "6px dashed #FFE4CC",
              display: "flex",
            }}
          />
          {/* perforation notches (cream circles over the ticket edges) */}
          <div
            style={{
              position: "absolute",
              left: 79,
              top: -14,
              width: 27,
              height: 27,
              borderRadius: 999,
              background: "#FFE4CC",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 79,
              bottom: -14,
              width: 27,
              height: 27,
              borderRadius: 999,
              background: "#FFE4CC",
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
