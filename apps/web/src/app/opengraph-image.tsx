import { ImageResponse } from "next/og";

// One image serves every locale, so it carries only brand and network names.
export const alt = "Nowvi: TikTok, X, Facebook";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori reads no CSS variables; the hex values mirror --primary and --primary-foreground in globals.css.
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 96,
        gap: 24,
        background: "#5b21b6",
        color: "#ffffff",
      }}
    >
      <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -4 }}>Nowvi</div>
      <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.15, maxWidth: 900 }}>TikTok • X • Facebook</div>
    </div>,
    size,
  );
}
