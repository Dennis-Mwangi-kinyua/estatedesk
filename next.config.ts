import type { NextConfig } from "next";

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
