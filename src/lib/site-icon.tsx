import { ImageResponse } from "next/og";
import { getSiteLogo } from "@/lib/site-images";

// Browser-tab / home-screen icon: the logo uploaded in Admin → Website
// images → Logo, or the fan mark when there isn't one. Hex values here
// mirror tokens.css (--color-ink / --color-accent-2 / --color-paper) —
// ImageResponse can't read CSS custom properties.
const INK = "#2a211c";
const OXBLOOD = "#6b2a22";
const PAPER = "#fbf6ef";

export async function siteIcon(size: number) {
  const logo = await getSiteLogo();
  return new ImageResponse(
    logo ? (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo.url} alt="" width={size} height={size} style={{ objectFit: "contain" }} />
      </div>
    ) : (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: PAPER,
          borderRadius: size / 5,
        }}
      >
        <svg viewBox="0 0 40 40" width={size * 0.9} height={size * 0.9} fill="none">
          <path d="M7 23a13 13 0 0 1 26 0" stroke={INK} strokeWidth="2.4" />
          <line x1="6" y1="23" x2="34" y2="23" stroke={INK} strokeWidth="2.4" />
          <line x1="20" y1="23" x2="20" y2="12" stroke={OXBLOOD} strokeWidth="2.4" />
          <circle cx="20" cy="23" r="2.6" fill={INK} />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
