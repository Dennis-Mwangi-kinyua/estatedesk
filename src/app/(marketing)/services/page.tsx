import OperationsShowcase from "@/components/marketing/operations-showcase";
import { absoluteUrl, publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Property Management System for Kenya, East Africa and Dubai",
  description:
    "EstateDesk System helps property teams in Kenya, East Africa, Dubai, the UAE, and global rental markets manage tenants, rent, leases, caretakers, inspections, maintenance issues, payments, water bills, staff access, reports, and records online.",
  path: "/services",
  keywords: [
    "property management system Kenya",
    "property management system East Africa",
    "property management system Dubai",
    "property management system UAE",
    "tenant management system Kenya",
    "rent tracking software Kenya",
    "caretaker workflow software",
    "property inspection software Kenya",
    "remote rental management system",
  ],
});

export default function ServicesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "EstateDesk property management system",
        url: absoluteUrl("/services"),
        provider: {
          "@type": "Organization",
          name: "EstateDesk",
          url: absoluteUrl("/"),
        },
        areaServed: {
          "@type": "Country",
          name: "Kenya",
        },
        serviceType: "Property management software",
        description:
          "Online property management software for tenants, rent, leases, caretakers, inspections, maintenance issues, payments, water bills, staff access, reports, and records across Kenya, East Africa, Dubai, the UAE, and global rental markets.",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OperationsShowcase standalone />
    </main>
  );
}
