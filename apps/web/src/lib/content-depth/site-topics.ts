import type { ContentDepthSections } from "@/lib/content-depth/types";
import { getGuidePath, getPublicGuides, isPublicGuideArticle } from "@/lib/guides";
import { guideArticles } from "@/lib/guides/articles";

export const sharedWorkflowScenarios = [
  {
    title: "Month-end rent follow-up",
    body: "A property manager opens the dashboard, filters unpaid tenants, reviews balances beside lease and water records, sends reminders, and records payments without rebuilding a spreadsheet for every building.",
  },
  {
    title: "Caretaker water reading to tenant bill",
    body: "A caretaker records a meter reading in the field, the office reviews it, approves the charge, and the tenant sees the updated balance in the same workflow that already holds rent and occupancy history.",
  },
  {
    title: "Tenant issue from report to closure",
    body: "A tenant submits a maintenance request, the office assigns a caretaker, status updates stay visible, and the landlord can review the full issue trail instead of relying on chat screenshots alone.",
  },
  {
    title: "Vacancy marketing and enquiry handling",
    body: "A vacant unit is published on public vacancy pages, tenants discover it by location and unit type, and the managing office receives enquiries with clearer context about the property and availability.",
  },
  {
    title: "Move-out review with combined records",
    body: "During a move-out, the team reviews rent balance, water charges, inspection notes, and issue history together so clearance decisions are based on searchable records rather than scattered files.",
  },
  {
    title: "Remote landlord portfolio review",
    body: "A diaspora or remote owner signs in, reviews occupancy, balances, open issues, and recent activity online, and follows up with the local team using the same operational record set.",
  },
] as const;

export const sharedProblemsSolved = [
  {
    problem: "Rent records live in notebooks, receipts, and separate Excel files.",
    solution:
      "EstateDesk connects rent charges, payments, balances, and tenant context in one searchable workspace.",
  },
  {
    problem: "Water billing is calculated separately from rent and hard to audit later.",
    solution:
      "Readings, tenant water charges, billing history, and balances stay tied to the unit and tenant record.",
  },
  {
    problem: "Maintenance requests disappear into WhatsApp threads.",
    solution:
      "Issues are logged, assigned, updated, and reviewed with status history that managers and landlords can search.",
  },
  {
    problem: "Vacant units are announced inconsistently across calls and social posts.",
    solution:
      "Public vacancy pages give tenants a structured way to discover available units by location and property type.",
  },
  {
    problem: "Staff handovers lose context when notebooks or spreadsheets change hands.",
    solution:
      "Role-aware access and centralized records make tenant, lease, billing, and issue history easier to continue.",
  },
  {
    problem: "Owners cannot verify what the local team did without manual summaries.",
    solution:
      "Reports, notifications, inspections, and activity records create a clearer online view of daily operations.",
  },
] as const;

export const sharedLongFormGuides = getPublicGuides().map((guide) => ({
  title: guide.title,
  href: getGuidePath(guide.slug),
  description: guide.summary,
}));

export function guideTopicLink(slug: string) {
  const guide = guideArticles.find((entry) => entry.slug === slug);

  if (!guide || !isPublicGuideArticle(guide)) {
    throw new Error(`Missing public guide article for slug: ${slug}`);
  }

  return {
    title: guide.title,
    href: getGuidePath(guide.slug),
    description: guide.summary,
  };
}

export const sharedTopicGuides = [
  {
    title: "Property management software in Kenya",
    href: "/property-management-software-kenya",
    description:
      "Deep guide for Kenyan landlords, agencies, caretakers, rent tracking, water billing, vacancies, and inspections.",
  },
  {
    title: "Landlord software",
    href: "/landlord-software",
    description:
      "How individual landlords organize tenants, leases, balances, vacancies, maintenance, and portfolio reporting.",
  },
  {
    title: "Rent tracking software",
    href: "/rent-tracking-software",
    description:
      "Structured rent charges, payment records, unpaid tenant follow-up, and reporting beyond manual spreadsheets.",
  },
  {
    title: "Water billing software",
    href: "/water-billing-software",
    description:
      "Meter readings, tenant water charges, billing history, and balance review inside rental operations.",
  },
  {
    title: "Property management guides",
    href: "/guides",
    description:
      "Long-form guides on rent tracking, water billing, caretakers, tenant issues, vacancies, move-outs, and remote landlords.",
  },
  {
    title: "Property management FAQ",
    href: "/faq",
    description:
      "Long-form answers on pricing, regions, tenant workflows, caretakers, inspections, and rollout questions.",
  },
  {
    title: "Vacancy discovery",
    href: "/vacancies",
    description:
      "Public listings for apartments, bedsitters, shops, offices, and other rental spaces by location.",
  },
] as const;

export const sharedEditorialDepth = [
  "Property management content should answer real operational questions, not just list features. Landlords want to know how rent follow-up works when a tenant pays late. Managers want to know how caretaker readings become tenant bills. Tenants want to know how maintenance requests are tracked after submission. EstateDesk public pages are written around those practical workflows so search engines and readers find useful depth instead of shallow marketing copy.",
  "Search intent for rental software often mixes geography, role, and workflow. One visitor may search for property management software in Kenya, another for landlord software, another for rent tracking, and another for water billing. EstateDesk uses dedicated public pages for each intent, then links them together through services, FAQ, markets, and homepage guides so the site builds topical authority across the full rental operations journey.",
  "Content depth also means explaining how records connect. A lease connects to a tenant and unit. Rent connects to balances and payment history. Water billing connects to readings and move-out review. Issues connect to caretakers and inspections. Vacancies connect to public discovery. When those connections are described clearly, the site becomes more useful for humans and easier for search systems to understand what EstateDesk actually does.",
] as const;

export const siteContentDepth: ContentDepthSections = {
  scenariosTitle: "How rental teams use EstateDesk in practice",
  scenarios: [...sharedWorkflowScenarios],
  problemsTitle: "Problems EstateDesk helps property teams solve",
  problems: [...sharedProblemsSolved],
  guidesTitle: "Explore related EstateDesk guides",
  guides: [...sharedTopicGuides],
  editorialTitle: "Why content depth matters in property management software",
  editorial: [...sharedEditorialDepth],
};