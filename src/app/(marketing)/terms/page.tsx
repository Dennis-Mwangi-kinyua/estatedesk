import { TrustPage } from "@/components/marketing/trust-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Terms of Service",
  description:
    "EstateDesk terms of service for organizations using property management, billing, tenant, staff, and vacancy workflows.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <TrustPage
      eyebrow="Terms"
      title="Terms of Service"
      description="The operating terms for using EstateDesk as a property management and rental operations platform."
      updatedAt="June 2, 2026"
      sections={[
        {
          title: "Use of the service",
          body: [
            "EstateDesk is provided for property management, tenant administration, rent and utility workflows, staff collaboration, issue tracking, public vacancies, and related operational records.",
            "Users must access only organizations and records they are authorized to manage. Organization administrators are responsible for staff access, data accuracy, and appropriate use of tenant information.",
          ],
        },
        {
          title: "Customer responsibilities",
          body: [
            "Customers are responsible for lawful collection of tenant and staff data, accurate billing entries, payment verification, notices, lease terms, and operational decisions made from platform records.",
            "Customers should maintain their own internal approval processes for financial, legal, tax, and tenancy decisions.",
          ],
        },
        {
          title: "Availability and support",
          body: [
            "EstateDesk is designed for reliable web-based access, but availability may be affected by maintenance, hosting providers, database providers, messaging providers, payment providers, internet connectivity, or events outside reasonable control.",
            "Support requests should include the organization, affected workflow, approximate time, user role, and a clear description of the issue.",
          ],
        },
        {
          title: "Limitations",
          body: [
            "EstateDesk is operational software, not legal, tax, accounting, or financial advice. Customers should consult qualified professionals for regulated decisions.",
            "Terms should be reviewed by counsel before production commercial launch in each target market.",
          ],
        },
      ]}
    />
  );
}
