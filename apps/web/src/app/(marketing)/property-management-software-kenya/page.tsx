import { kenyaLandingContent } from "@/components/marketing/seo-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Best Property Management Software in Kenya | M-Pesa & KRA eTIMS",
  description:
    "EstateDesk is the best property management software in Kenya for landlords and managers: M-Pesa rent collection, water billing, offline caretakers, double-entry accounting, KRA eTIMS-ready receipts, WhatsApp ops, and vacancy SEO—better than spreadsheets or generic foreign PMS tools.",
  path: kenyaLandingContent.path,
  keywords: [
    "best property management software Kenya",
    "property management software Kenya",
    "M-Pesa rent collection software",
    "KRA eTIMS property management",
    "landlord software Kenya",
    "tenant management system Kenya",
    "rent tracking software Kenya",
    "water billing software Kenya",
    "vacant houses Kenya",
    "property manager software Nairobi",
    "Excel alternative for landlords Kenya",
  ],
});

export default function PropertyManagementSoftwareKenyaPage() {
  return <SeoLandingPage content={kenyaLandingContent} />;
}
