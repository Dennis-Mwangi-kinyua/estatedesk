import { TrustPage } from "@/components/marketing/trust-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Security",
  description:
    "EstateDesk security overview covering role-based access, organization isolation, audit logs, private routes, backups, and operational monitoring.",
  path: "/security",
});

export default function SecurityPage() {
  return (
    <TrustPage
      eyebrow="Security"
      title="Security Overview"
      description="How EstateDesk is structured to protect property operations, tenant records, staff access, and private dashboards."
      updatedAt="June 2, 2026"
      sections={[
        {
          title: "Access controls",
          body: [
            "EstateDesk uses authenticated sessions, active organization context, organization membership checks, and role-based authorization for admin, manager, office, accountant, caretaker, tenant, and platform users.",
            "Private dashboards, platform administration, API routes, and print routes are marked noindex and protected from public discovery. Public auth and verification pages remain indexable.",
          ],
        },
        {
          title: "Auditability",
          body: [
            "Sensitive actions should be recorded with actor, organization, entity, request, and metadata context so teams can review administrative and security-relevant changes.",
            "Platform operators should review audit logs regularly during early production and after any access-control, payment, billing, or tenant-record incident.",
          ],
        },
        {
          title: "Infrastructure readiness",
          body: [
            "Production deployments should use managed PostgreSQL, secure environment secrets, object storage recovery/versioning, TLS, uptime monitoring, and scheduled backup verification.",
            "The health endpoint and CI quality gate provide a baseline for production checks, but external monitoring and error tracking should be configured before paid customer launch.",
          ],
        },
        {
          title: "Responsible disclosure",
          body: [
            "Security issues should be reported through the contact channel with reproduction steps, affected URL, approximate time, and impact. Do not access or modify data that is not yours while validating a report.",
          ],
        },
      ]}
    />
  );
}
