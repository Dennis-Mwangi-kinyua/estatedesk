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
