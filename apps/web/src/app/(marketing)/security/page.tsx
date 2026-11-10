import type { Metadata } from "next";
import { TrustPage } from "@/components/marketing/trust-page";
import { trustContentDepth } from "@/lib/content-depth/marketing-depth";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Security",
  description:
    "EstateDesk security overview covering role-based access, organization isolation, audit logs, private routes, backups, and operational monitoring.",
  path: "/security",
});

export default function SecurityPage() {
  return (
    <TrustPage
      eyebrow="Security"
      title="Security for your property workspace"
      description="Understand how account protection, workspace permissions and security history help safeguard your property operations."
      updatedAt="10 November 2026"
      sections={[
        {
          title: "Protect your account",
          body: [
            "The Security Centre lets signed-in users review their devices, change their password and inspect their own recorded security activity. A self-service password change requires the current password, renews the current session credential, signs out other devices and invalidates outstanding reset links.",
            "Use a unique passphrase and a password manager. If you do not recognize a device, revoke its session and update your password. Security activity is private to the account owner; administrators retain their separately authorized audit tools.",
          ],
        },
        {
          title: "Access controls",
          body: [
            "EstateDesk uses authenticated sessions, active organization context, organization membership checks, and role-based authorization for admin, manager, office, accountant, caretaker, tenant, landlord, security and platform users, with separate provider ownership checks.",
            "Private records are authorized on the server for the current account, organization and permitted property scope. Search-indexing controls supplement these checks; they do not replace authentication or authorization.",
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
      contentDepth={trustContentDepth}
    />
  );
}
