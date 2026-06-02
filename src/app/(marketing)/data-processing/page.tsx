import { TrustPage } from "@/components/marketing/trust-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Data Processing and Retention",
  description:
    "EstateDesk data processing and retention overview for organizations managing tenant, lease, billing, property, and staff records.",
  path: "/data-processing",
});

export default function DataProcessingPage() {
  return (
    <TrustPage
      eyebrow="Data"
      title="Data Processing and Retention"
      description="How EstateDesk expects organizations to think about data handling, retention, exports, backups, and deletion."
      updatedAt="June 2, 2026"
      sections={[
        {
          title: "Processing roles",
          body: [
            "Organizations generally decide what tenant, property, staff, lease, billing, and operational information is entered into EstateDesk. EstateDesk processes that information to provide the platform.",
            "Platform operators should document customer-specific processing terms before enterprise rollout or regulated deployments.",
          ],
        },
        {
          title: "Retention",
          body: [
            "Retention periods should reflect legal, tax, tenancy, audit, and business requirements. The platform includes organization-level retention settings that can support future enforcement workflows.",
            "Soft-deleted records may remain available for audit, recovery, compliance review, or operational continuity until retention rules are applied.",
          ],
        },
        {
          title: "Exports and portability",
          body: [
            "EstateDesk includes data export workflows so organizations can retrieve operational records. Export access should be restricted to trusted administrators and recorded in audit logs.",
            "Exported files should be handled as sensitive data because they may contain tenant, staff, payment, lease, and property records.",
          ],
        },
        {
          title: "Backups and deletion",
          body: [
            "Production databases and object storage should be backed up through managed infrastructure. Backup retention and restore drills should be documented in the operations runbook.",
            "Deletion requests should be reviewed carefully so required tenancy, payment, audit, legal, and tax records are not removed prematurely.",
          ],
        },
      ]}
    />
  );
}
