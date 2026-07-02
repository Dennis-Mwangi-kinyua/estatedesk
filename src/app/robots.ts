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
        "/staff/",
        "/tenants/",
        "/buildings/",
        "/charges/",
        "/reports/",
        "/move-outs/",
        "/change-password",
        "/taxes/",
        "/api-keys",
        "/access-denied",
        "/sign-lease/",
        "/offline",
        "/account-suspended",
        "/service-terminated",
        "/are-you-lost",
      ],
    },
    sitemap: [
      `${siteUrl}/sitemap-index.xml`,
    ],
    host: siteUrl,
  };
}
