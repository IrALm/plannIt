import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#EFE9DC",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(110,123,78,.12)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <svg viewBox="0 0 32 32" width="92" height="92">
            <circle cx="16" cy="18" r="11" fill="#6E7B4E" />
            <path d="M16 12c.6-4 3.5-6 7-6.5-.6 4-3 6-7 6.5z" fill="#6E7B4E" />
            <path
              d="M11.5 21.5c1.6 1.6 7.4 1.6 9 0"
              stroke="#FBF8F1"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div style={{ display: "flex", fontSize: 88, color: "#26241E" }}>
          Plann<span style={{ color: "#6E7B4E" }}>It</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#5C574B", marginTop: 18 }}>
          Ton planning, enfin clair.
        </div>
      </div>
    ),
    { ...size }
  );
}
