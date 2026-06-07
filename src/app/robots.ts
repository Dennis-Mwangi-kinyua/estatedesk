import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/llms.txt"],
      disallow: [
        "/dashboard/",
        "/platform/",
        "/api/",
        "/print/",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/accept-invite/",
        "/properties",
        "/properties/",
        "/units",
        "/units/",
      ],
    },
    sitemap: [
      `${siteUrl}/sitemap-index.xml`,
    ],
    host: siteUrl,
  };
}
