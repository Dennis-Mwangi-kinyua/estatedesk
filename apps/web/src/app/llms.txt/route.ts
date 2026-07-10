import { guidePublicIndexItems } from "@/lib/guides";
import { publicSiteIndexWithUrls } from "@/lib/public-site-index";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/seo";

export async function GET() {
  const pages = publicSiteIndexWithUrls().filter((page) => !page.path.startsWith("/guides"));
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
    "## Property Management Guides",
    ...guidePublicIndexItems.flatMap((guide) => [
      "",
      `- ${guide.title}: ${absoluteUrl(guide.path)}`,
      `  ${guide.description}`,
    ]),
    "",
    "## Core Topics",
    "- Property management software",
    "- Landlord software",
    "- Tenant management software",
    "- Rent tracking and unpaid rent follow-up",
    "- Water billing workflows",
    "- Caretaker field operations and shift handover",
    "- Maintenance issue tracking with SLA visibility",
    "- Property inspections and move-out checklists",
    "- Offline meter reading and issue capture for field staff",
    "- WhatsApp and SMS tenant contact from property dashboards",
    "- Public vacancy discovery",
    "- Remote and diaspora landlord management",
    "- East Africa property management",
    "- Dubai and UAE property management",
    "",
    "## Caretaker Field Operations (authenticated)",
    "- Today's work queue for inspections, meter readings, and assigned issues",
    "- Issue lifecycle: report, start work, progress notes, completion photo, office approval",
    "- Printable issue work orders and inspection reports at /print/* (login-required, disallowed in robots.txt)",
    "- Unit QR profiles, scoped search, calendar, documents, broadcasts, and vendor dispatch",
    "- Bilingual English/Swahili navigation and handover templates for Kenyan field teams",
    "- Offline queue for meter readings and issues with photo sync when connectivity returns",
    "",
    "## Content Depth Themes",
    "- Month-end rent follow-up and unpaid tenant visibility",
    "- Caretaker meter readings through tenant water billing",
    "- Maintenance issue reporting, assignment, SLA tracking, and closure",
    "- Vacancy publishing and tenant discovery by location",
    "- Move-out review across rent, water, and inspection records",
    "- Remote landlord and agency accountability workflows",
    "- Problem/solution content replacing notebook, spreadsheet, and chat-only operations",
    "",
    "## Indexing Notes",
    "- Public marketing, pricing, FAQ, contact, vacancy, auth, and document verification pages are intended for search discovery.",
    "- Login-required dashboards (org, tenant, caretaker, landlord, platform), API routes, and /print work orders are noindex and disallowed in robots.txt.",
    "- Utility pages such as offline, account suspension notices, invite acceptance, and are-you-lost remain out of the index.",
    "- LLM crawlers (GPTBot, Google-Extended, CCBot) are blocked from private operational routes via robots.txt.",
  ].join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
