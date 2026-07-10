import { waterBillingLandingContent } from "@/components/marketing/seo-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Water Billing Software for Rental Properties",
  description:
    "EstateDesk water billing software helps landlords and property managers manage meter readings, tenant water bills, billing history, balances, rent records, and reports.",
  path: waterBillingLandingContent.path,
  keywords: [
    "water billing software",
    "water billing software Kenya",
    "rental water billing software",
    "tenant water billing system",
    "property water billing software",
    "meter reading software landlords",
  ],
});

export default function WaterBillingSoftwarePage() {
  return <SeoLandingPage content={waterBillingLandingContent} />;
}
