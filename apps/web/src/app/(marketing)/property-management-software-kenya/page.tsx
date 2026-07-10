import { kenyaLandingContent } from "@/components/marketing/seo-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Property Management Software in Kenya",
  description:
    "EstateDesk is property management software in Kenya for landlords, property managers, agencies, caretakers, and tenants: rent tracking, water billing, vacancies, maintenance, inspections, reports, and staff access.",
  path: kenyaLandingContent.path,
  keywords: [
    "property management software Kenya",
    "best property management software Kenya",
    "landlord software Kenya",
    "tenant management system Kenya",
    "rent tracking software Kenya",
    "water billing software Kenya",
    "vacant houses Kenya",
    "property manager software Nairobi",
  ],
});

export default function PropertyManagementSoftwareKenyaPage() {
  return <SeoLandingPage content={kenyaLandingContent} />;
}
