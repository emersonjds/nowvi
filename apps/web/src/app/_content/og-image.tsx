import { ImageResponse } from "next/og";

import { OG_IMAGE_SIZE } from "./landings";

// Satori reads no CSS variables; the hex values mirror --primary and --accent in globals.css.
const PRIMARY = "#5b21b6";
const ACCENT = "#a3e635";

export const ogImage = (heading: string) =>
  new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: PRIMARY,
        color: "#ffffff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <svg width="96" height="96" viewBox="0 0 64 64" aria-hidden>
          <rect width="64" height="64" rx="16" fill="#ffffff" />
          <path
            d="M21 19.5v25c0 1.6 1.7 2.5 3 1.7l19.5-12.5c1.2-.8 1.2-2.6 0-3.4L24 17.8c-1.3-.8-3 .1-3 1.7z"
            fill={PRIMARY}
          />
          <circle cx="44.5" cy="18.5" r="5.5" fill={ACCENT} />
        </svg>
        <div style={{ fontSize: 64, fontWeight: 800 }}>Nowvi</div>
      </div>
      <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, maxWidth: 1040 }}>{heading}</div>
      <div style={{ fontSize: 36, color: ACCENT }}>TikTok • X • Facebook</div>
    </div>,
    OG_IMAGE_SIZE,
  );
