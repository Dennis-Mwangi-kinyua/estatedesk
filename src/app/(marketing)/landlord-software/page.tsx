import { landlordLandingContent } from "@/components/marketing/seo-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Landlord Software for Rent, Tenants and Vacancies",
  description:
    "EstateDesk landlord software helps landlords manage tenants, leases, rent balances, water bills, vacant units, maintenance, inspections, staff access, and reports online.",
  path: landlordLandingContent.path,
  keywords: [
    "landlord software",
    "landlord software Kenya",
    "software for landlords",
    "rental property software for landlords",
    "rent management software for landlords",
    "tenant management software for landlords",
  ],
});

export default function LandlordSoftwarePage() {
  return <SeoLandingPage content={landlordLandingContent} />;
}
