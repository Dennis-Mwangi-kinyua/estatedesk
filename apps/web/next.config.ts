import path from "node:path";
import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import type { NextConfig } from "next";
import { contentSecurityPolicy } from "./src/lib/security/content-security-policy";
import { config as loadEnv } from "dotenv";

/** Monorepo root (estatedesk-main) — keeps Next resolving hoisted node_modules correctly. */
const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
// npm workspace commands run from apps/web; also load the shared root environment.
// Existing deployment and app-specific values retain precedence.
if (!process.env.TEST_DATABASE_URL) loadEnv({ path: path.join(monorepoRoot, ".env"), quiet: true });
const isProduction = process.env.NODE_ENV === "production";
const webPackage = JSON.parse(
  readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "package.json"), "utf8"),
) as { version: string };

function vacancyImageRemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "**.amazonaws.com",
      pathname: "/**",
    },
  ];

  patterns.push({ protocol: "https", hostname: "imagedelivery.net", pathname: "/**" });

  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (publicBaseUrl) {
    try {
      const { hostname } = new URL(publicBaseUrl);
      patterns.push({
        protocol: "https",
        hostname,
        pathname: "/**",
      });
    } catch {
      // Ignore invalid S3_PUBLIC_BASE_URL values at build time.
    }
  }

  const bucket = process.env.S3_BUCKET ?? process.env.S3_BUCKET_NAME;
  const region = process.env.S3_REGION?.trim();
  if (bucket && region) {
    patterns.push({
      protocol: "https",
      hostname: `${bucket}.s3.${region}.amazonaws.com`,
      pathname: "/**",
    });
    patterns.push({
      protocol: "https",
      hostname: `s3.${region}.amazonaws.com`,
      pathname: `/${bucket}/**`,
    });
  }

  return patterns;
}

const csp = contentSecurityPolicy({ development: !isProduction });

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: csp },
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
      "display-capture=()",
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
    value: "public, max-age=0, s-maxage=60, stale-while-revalidate=60",
  },
  {
    key: "CDN-Cache-Control",
    value: "public, max-age=60, stale-while-revalidate=60",
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
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? process.env.NEXT_DEPLOYMENT_ID,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_APP_VERSION: webPackage.version,
  },
  // App lives in apps/web; dependencies are hoisted to the repo root.
  outputFileTracingRoot: monorepoRoot,
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  transpilePackages: [
    "@estatedesk/config",
    "@estatedesk/contracts",
    "@estatedesk/db-kit",
    "@estatedesk/auth-sdk",
    "@estatedesk/service-client",
    "@estatedesk/events",
    "@estatedesk/public-vacancy",
    "@estatedesk/notifications",
  ],
  images: {
    remotePatterns: vacancyImageRemotePatterns(),
  },
  experimental: {
    // Keep the full admin/mobile route graph within Vercel's 8 GB builder.
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
    // Keep production builds parallel while avoiding excessive workers on
    // small CI/deployment builders.
    cpus: Math.min(4, availableParallelism()),
    serverActions: { bodySizeLimit: "8mb" },
    optimizePackageImports: ["lucide-react", "react-icons"],
  },
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
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
      ...[
        "/offline",
        "/offline-shell.html",
        "/vacancies",
        "/vacancies/:path*",
      ].map((source) => ({ source, headers: PUBLIC_FAST_EDGE_CACHE_HEADERS })),

      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      ...[
        "/",
        "/services",
        "/faq",
        "/landlord-software",
        "/rent-tracking-software",
        "/water-billing-software",
        "/property-management-software-kenya",
        "/property-management-software-dubai",
        "/property-management-software-africa",
        "/property-management-software-middle-east",
        "/remote-property-management-software",
        "/privacy",
        "/terms",
        "/security",
        "/data-processing",
        "/data-processing-agreement",
        "/status",
        "/pricing",
        "/contact",
        "/guides",
        "/guides/:path*",
        "/property-management-markets",
      ].map((source) => ({ source, headers: PUBLIC_EDGE_CACHE_HEADERS })),

      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      ...[
        "/profile/:path*",
        "/dashboard/:path*",
        "/platform/:path*",
        "/api/:path*",
        "/print/:path*",
        "/staff/:path*",
        "/tenants/:path*",
        "/buildings/:path*",
        "/charges/:path*",
        "/reports/:path*",
        "/move-outs/:path*",
        "/change-password",
        "/taxes/:path*",
        "/api-keys",
        "/access-denied",
        "/sign-lease/:path*",
        "/verify-document/:path*",
        "/verify-lease/:path*",
        "/account-suspended",
        "/service-terminated",
        "/properties",
        "/properties/:path*",
        "/units",
        "/units/:path*",
        "/are-you-lost",
      ].map((source) => ({ source, headers: PRIVATE_HEADERS })),
    ];
  },
};

export default nextConfig;
