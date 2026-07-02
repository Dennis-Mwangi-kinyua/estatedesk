import { publicSiteIndexWithUrls } from "@/lib/public-site-index";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export async function GET() {
  const pages = publicSiteIndexWithUrls();
  const content = [
    `# ${SITE_NAME}`,
    "",
    SITE_DESCRIPTION,
    "",
    "## Primary Public Pages",
    ...pages.flatMap((page) => [
      "",
      `- ${page.title}: ${page.url}`,
      `  ${page.description}`,
    ]),
    "",
    "## Core Topics",
    "- Property management software",
    "- Landlord software",
    "- Tenant management software",
    "- Rent tracking and unpaid rent follow-up",
    "- Water billing workflows",
    "- Caretaker management",
    "- Maintenance issue tracking",
    "- Property inspections",
    "- Public vacancy discovery",
    "- Remote and diaspora landlord management",
    "- East Africa property management",
    "- Dubai and UAE property management",
    "",
    "## Indexing Notes",
    "- Public marketing, pricing, FAQ, contact, vacancy, auth, and document verification pages are intended for search discovery.",
    "- Login-required dashboards, platform administration, API, print, and operational routes are noindex and disallowed in robots.txt.",
    "- Utility pages such as offline, account suspension notices, and are-you-lost remain out of the index.",
  ].join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
