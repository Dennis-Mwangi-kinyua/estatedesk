import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

const PRIVATE_ROUTE_PREFIXES = [
  "/dashboard/",
  "/platform/",
  "/api/",
  "/print/",
  "/staff/",
  "/tenants/",
  "/properties",
  "/properties/",
  "/units",
  "/units/",
  "/buildings/",
  "/charges/",
  "/reports/",
  "/move-outs/",
  "/change-password",
  "/taxes/",
  "/api-keys",
  "/access-denied",
  "/sign-lease/",
  "/accept-invite/",
  "/offline",
  "/account-suspended",
  "/service-terminated",
  "/are-you-lost",
] as const;

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt"],
        disallow: [...PRIVATE_ROUTE_PREFIXES],
      },
      {
        userAgent: "GPTBot",
        disallow: [...PRIVATE_ROUTE_PREFIXES],
      },
      {
        userAgent: "ChatGPT-User",
        disallow: [...PRIVATE_ROUTE_PREFIXES],
      },
      {
        userAgent: "Google-Extended",
        disallow: [...PRIVATE_ROUTE_PREFIXES],
      },
      {
        userAgent: "CCBot",
        disallow: [...PRIVATE_ROUTE_PREFIXES],
      },
    ],
    sitemap: [`${siteUrl}/sitemap-index.xml`],
    host: siteUrl,
  };
}