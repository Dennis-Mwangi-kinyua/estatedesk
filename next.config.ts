import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  [
    "script-src 'self' 'unsafe-inline'",
    isProduction ? "" : "'unsafe-eval'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://www.googleadservices.com",
    "https://googleads.g.doubleclick.net",
  ]
    .filter(Boolean)
    .join(" "),
  [
    "connect-src 'self'",
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://stats.g.doubleclick.net",
  ].join(" "),
  "frame-src https://www.googletagmanager.com https://td.doubleclick.net",
  "worker-src 'self' blob:",
  isProduction ? "upgrade-insecure-requests" : "",
].filter(Boolean);

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=(self)",
      "payment=()",
      "usb=()",
      "fullscreen=(self)",
    ].join(", "),
  },
];

const PRIVATE_HEADERS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "Cache-Control", value: "no-store, max-age=0" },
];

const PUBLIC_EDGE_CACHE_HEADERS = [
  {
    key: "Cache-Control",
    value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  },
  {
    key: "CDN-Cache-Control",
    value: "public, max-age=3600, stale-while-revalidate=86400",
  },
];

const PUBLIC_FAST_EDGE_CACHE_HEADERS = [
  {
    key: "Cache-Control",
    value: "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
  },
  {
    key: "CDN-Cache-Control",
    value: "public, max-age=300, stale-while-revalidate=3600",
  },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.estatedesk.co.ke",
          },
        ],
        destination: "https://estatedesk.co.ke/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/services",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/faq",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/landlord-software",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/rent-tracking-software",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/water-billing-software",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/property-management-software-kenya",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/property-management-software-dubai",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/privacy",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/terms",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/security",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/data-processing",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/status",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/pricing",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/contact",
        headers: PUBLIC_EDGE_CACHE_HEADERS,
      },
      {
        source: "/vacancies",
        headers: PUBLIC_FAST_EDGE_CACHE_HEADERS,
      },
      {
        source: "/vacancies/:path*",
        headers: PUBLIC_FAST_EDGE_CACHE_HEADERS,
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: PRIVATE_HEADERS,
      },
      {
        source: "/platform/:path*",
        headers: PRIVATE_HEADERS,
      },
      {
        source: "/api/:path*",
        headers: PRIVATE_HEADERS,
      },
      {
        source: "/print/:path*",
        headers: PRIVATE_HEADERS,
      },
      {
        source: "/login",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/register",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/forgot-password",
        headers: PRIVATE_HEADERS,
      },
      {
        source: "/reset-password",
        headers: PRIVATE_HEADERS,
      },
      {
        source: "/verify-email",
        headers: PRIVATE_HEADERS,
      },
      {
        source: "/accept-invite/:path*",
        headers: PRIVATE_HEADERS,
      },
      {
        source: "/properties",
        headers: PRIVATE_HEADERS,
      },
      {
        source: "/properties/:path*",
        headers: PRIVATE_HEADERS,
      },
      {
        source: "/units",
        headers: PRIVATE_HEADERS,
      },
      {
        source: "/units/:path*",
        headers: PRIVATE_HEADERS,
      },
      {
        source: "/are-you-lost",
        headers: PRIVATE_HEADERS,
      },
    ];
  },
};

export default nextConfig;
