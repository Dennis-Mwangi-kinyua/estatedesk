import type { Metadata } from "next";
import MarketingHomePage from "@/components/marketing/marketing-home-page";
import { publicPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = publicPageMetadata({
  title: "Property Management Software in Kenya | EstateDesk",
  description:
    "Manage rentals in Kenya with EstateDesk. Track rent, M-Pesa payments, tenants, water bills and accounting. Compare plans and start free.",
  path: "/",
  keywords: [
    "property management software in Kenya",
    "property management software East Africa",
    "property management software Dubai",
    "property management software UAE",
    "landlord software Nairobi",
    "tenant management system Kenya",
    "rent collection software Kenya",
    "vacant houses to rent Kenya",
    "remote landlord software",
  ],
});

export default MarketingHomePage;
