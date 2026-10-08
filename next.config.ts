import type { NextConfig } from "next";

// Product/journal photos live in Supabase Storage (public bucket). next/image
// resizes them per slot and serves WebP from Vercel's cache, so visitors
// never download the multi-MB originals for a card — and Supabase egress
// (tight on the Free plan) is spent once per size, not once per visit.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
    formats: ["image/webp"],
    // 85 for cards/grids, 90 for the product gallery — both near-lossless
    // for watch photography. Anything else is coerced to the closest.
    qualities: [85, 90],
    // Uploaded files get unique names (timestamp/uuid), so a long cache is
    // safe: a replaced photo is a new URL.
    minimumCacheTTL: 2678400,
    // Dev only: some local networks (IPv6-only + NAT64) resolve Supabase to
    // 64:ff9b::/96, which the optimizer's SSRF guard reads as a private IP.
    // Production (Vercel) keeps the guard on; remotePatterns still limits
    // sources to our own Supabase storage either way.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
