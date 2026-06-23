import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

// Default Open Graph image for the site (used when a page does not provide its
// own). Branded in the Royal Covenant palette: navy field, gold monogram + rule.
export const runtime = "nodejs";
export const alt = `${SITE_NAME} — Plano, Texas`;
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
          backgroundColor: "#0B1436",
          color: "#F5F3EC",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 32,
            border: "2px solid rgba(232,198,107,0.45)",
            borderRadius: 24,
          }}
        />
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: "#E8C66B",
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          CE
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 56,
            fontWeight: 700,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          RCCG Covenant Embassy
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(245,243,236,0.75)",
          }}
        >
          Plano, Texas
        </div>
      </div>
    ),
    size,
  );
}
