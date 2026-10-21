import type { Metadata } from "next";
import { kenyaLandingContent } from "@/components/marketing/seo-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Property Management Software Kenya | M-Pesa & Rent Tracking",
  description: "Manage Kenyan rentals with EstateDesk: tenants, M-Pesa payment records, rent tracking, water billing and accounting. Compare plans for landlords and agencies.",
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
