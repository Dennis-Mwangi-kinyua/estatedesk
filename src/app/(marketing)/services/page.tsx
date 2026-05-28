import OperationsShowcase from "@/components/marketing/operations-showcase";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Property Management Services",
  description:
    "Explore EstateDesk workflows for property management, tenant records, rent payments, caretaker assignments, inspections, maintenance issues, and reporting in Kenya.",
  path: "/services",
});

export default function ServicesPage() {
  return <OperationsShowcase standalone />;
}
