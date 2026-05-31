import OperationsShowcase from "@/components/marketing/operations-showcase";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "EstateDesk System",
  description:
    "EstateDesk System helps property teams securely manage tenants, rent, leases, caretakers, inspections, maintenance issues, payments, and reports online.",
  path: "/services",
});

export default function ServicesPage() {
  return <OperationsShowcase standalone />;
}
