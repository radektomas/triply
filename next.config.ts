import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    // Destination photos never change, so once optimized keep them cached for a
    // year — avoids re-fetching the Pexels source and re-encoding on later hits.
    // (Only applies to images optimized AFTER deploy; already-cached entries
    // keep the TTL they were stored with.)
    minimumCacheTTL: 31536000,
    // Explicit AVIF-first (smaller) with WebP fallback. Next's default is
    // WebP-only — AVIF is opt-in — so this actually enables AVIF. First-encode
    // is a bit slower, but the 1-year cache above amortizes it.
    formats: ["image/avif", "image/webp"],
    // Pexels sources top out at ~1880px (large2x); the default deviceSizes go
    // up to 2048/3840, which can never carry more detail than the source yet
    // each spawns its own encode + cache entry. Trim the top two so wide/high-
    // DPR clients reuse the 1920 variant instead of generating wasteful ones.
    // imageSizes (small fixed-width srcset, e.g. avatars/thumbs) keeps defaults.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  async redirects() {
    return [
      // Legacy /examples/* routes — replaced by Quick Picks /trips/<slug>.
      { source: "/examples/prague", destination: "/trips/prague-budget-weekend", permanent: true },
      { source: "/examples/algarve", destination: "/trips/corfu-beach-reset", permanent: true },
      { source: "/examples/hallstatt", destination: "/trips/dolomites-mountain-stretch", permanent: true },
    ];
  },
  async headers() {
    // Content-Security-Policy in REPORT-ONLY mode — observes violations
    // without blocking, so we can validate coverage before enforcing.
    // Origins, by directive:
    //   script-src  va.vercel-scripts.com (Vercel Analytics);
    //               'unsafe-inline' required by Next's hydration scripts.
    //   style-src   'unsafe-inline' — the app uses inline style={{}} +
    //               gradient strings throughout, plus leaflet/react-day-picker.
    //   img-src     images.pexels.com (city photos), images.unsplash.com
    //               (VibeSearch suggestion thumbnails), *.basemaps.cartocdn.com
    //               (leaflet map tiles), *.googleusercontent.com (Google OAuth
    //               avatars), data: (inline SVG noise in GradientMesh).
    //   connect-src *.supabase.co (auth + DB browser client),
    //               photon.komoot.io (city autocomplete),
    //               open.er-api.com (currency rates),
    //               va.vercel-scripts.com (analytics).
    // NOTE: the n8n webhooks are NOT in connect-src — they are called only
    // server-side (lib/n8n.ts, /api/feedback); the browser never hits them.
    const cspReportOnly = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.pexels.com https://images.unsplash.com https://*.basemaps.cartocdn.com https://*.googleusercontent.com",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://photon.komoot.io https://open.er-api.com https://va.vercel-scripts.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspReportOnly,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
