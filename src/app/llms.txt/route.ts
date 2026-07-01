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
    "- Public marketing, pricing, FAQ, contact, and vacancy pages are intended for discovery.",
    "- Auth pages are noindex but follow links, so crawlers can discover public context without ranking login, registration, password reset, or invite pages.",
    "- Private dashboards, platform administration, API, and print routes are not public content.",
  ].join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
