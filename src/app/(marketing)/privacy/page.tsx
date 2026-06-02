import { TrustPage } from "@/components/marketing/trust-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Privacy Policy",
  description:
    "EstateDesk privacy policy for property management software users, organizations, tenants, staff, and public vacancy visitors.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <TrustPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="How EstateDesk approaches personal data, property records, tenant information, and public vacancy enquiries."
      updatedAt="June 2, 2026"
      sections={[
        {
          title: "Information we handle",
          body: [
            "EstateDesk may process account details, organization records, staff roles, tenant profiles, lease records, unit records, billing information, payment references, issue reports, inspection records, notifications, audit logs, and public vacancy enquiries.",
            "Organizations using EstateDesk are responsible for collecting and entering lawful, accurate data about their properties, staff, tenants, and operations.",
          ],
        },
        {
          title: "How information is used",
          body: [
            "Information is used to operate the platform, authenticate users, manage property workflows, support billing and tenant records, display public vacancies, deliver notifications, prevent abuse, and improve reliability.",
            "EstateDesk does not need tenant or property data for unrelated advertising use. Operational data should stay tied to the property management purpose for which it was provided.",
          ],
        },
        {
          title: "Data sharing",
          body: [
            "Data may be shared with service providers that help operate the platform, such as hosting, database, storage, messaging, email, uptime monitoring, and payment infrastructure providers.",
            "EstateDesk should only disclose customer data when required for platform operation, customer support, legal compliance, security investigation, or with authorized customer instruction.",
          ],
        },
        {
          title: "Security and retention",
          body: [
            "EstateDesk uses organization-scoped access controls, role-based permissions, private dashboard indexing controls, audit logs, and secure operational practices to reduce data exposure risk.",
            "Production organizations should define retention requirements for tenant, lease, billing, inspection, and audit records based on their operational and legal obligations.",
          ],
        },
      ]}
    />
  );
}
