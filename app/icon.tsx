import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#FFE4CC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
        }}
      >
        <div
          style={{
            fontSize: 22,
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
    { ...size },
  );
}
