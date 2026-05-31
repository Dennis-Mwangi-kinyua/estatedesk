import OperationsShowcase from "@/components/marketing/operations-showcase";
import { absoluteUrl } from "@/lib/seo";

export default function MarketingHomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${absoluteUrl("/")}#organization`,
        name: "EstateDesk",
        url: absoluteUrl("/"),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          url: absoluteUrl("/contact"),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${absoluteUrl("/")}#website`,
        name: "EstateDesk",
        url: absoluteUrl("/"),
        publisher: {
          "@id": `${absoluteUrl("/")}#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/vacancies")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        "@id": `${absoluteUrl("/")}#sitelinks`,
        name: "EstateDesk site links",
        itemListElement: [
          { "@type": "SiteNavigationElement", position: 1, name: "Login", url: absoluteUrl("/login") },
          { "@type": "SiteNavigationElement", position: 2, name: "Vacancies", url: absoluteUrl("/vacancies") },
          { "@type": "SiteNavigationElement", position: 3, name: "EstateDesk System", url: absoluteUrl("/services") },
          { "@type": "SiteNavigationElement", position: 4, name: "Sign Up", url: absoluteUrl("/register") },
          { "@type": "SiteNavigationElement", position: 5, name: "Pricing", url: absoluteUrl("/pricing") },
          { "@type": "SiteNavigationElement", position: 6, name: "Help", url: absoluteUrl("/contact") },
        ],
      },
      {
        "@type": "SoftwareApplication",
        name: "EstateDesk",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: absoluteUrl("/"),
        description:
          "Property management software for Kenya covering tenants, leases, rent, water bills, caretakers, inspections, maintenance issues, and team access.",
        areaServed: {
          "@type": "Country",
          name: "Kenya",
        },
        offers: {
          "@type": "Offer",
          category: "SaaS subscription",
          priceCurrency: "KES",
          url: absoluteUrl("/pricing"),
        },
        publisher: {
          "@id": `${absoluteUrl("/")}#organization`,
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OperationsShowcase
        standalone
        publicHeaderActive="home"
        showPricingNav={false}
        variant="rentals"
      />
    </main>
  );
}
