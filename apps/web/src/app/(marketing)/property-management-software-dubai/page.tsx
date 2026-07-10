import { dubaiLandingContent } from "@/components/marketing/seo-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Property Management Software for Dubai and UAE",
  description:
    "EstateDesk supports Dubai, UAE, diaspora, and remote property teams with online tenant records, rent tracking, maintenance, inspections, vacancies, reports, and staff access.",
  path: dubaiLandingContent.path,
  keywords: [
    "property management software Dubai",
    "property management software UAE",
    "landlord software Dubai",
    "real estate management software Dubai",
    "remote landlord software Dubai",
    "diaspora landlord property management software",
  ],
});

export default function PropertyManagementSoftwareDubaiPage() {
  return <SeoLandingPage content={dubaiLandingContent} />;
}
