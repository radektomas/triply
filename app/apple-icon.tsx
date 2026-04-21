import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
            fontSize: 124,
            fontWeight: 800,
            fontStyle: "italic",
            color: "#FF6B47",
            lineHeight: 1,
            display: "flex",
          }}
        >
          t
        </div>
      </div>
    ),
    { ...size }
  );
}
