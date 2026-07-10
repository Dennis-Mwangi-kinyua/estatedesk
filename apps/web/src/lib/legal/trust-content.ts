export const subprocessors = [
  {
    name: "Hosting and application runtime",
    purpose: "Serve the EstateDesk web application and APIs",
    data: "Account, organization, tenant, lease, payment, and operational records",
    region: "Configured production region",
  },
  {
    name: "PostgreSQL database provider",
    purpose: "Primary transactional datastore",
    data: "All application records required for property management workflows",
    region: "Configured production region",
  },
  {
    name: "Object storage provider",
    purpose: "Contracts, receipts, inspection photos, and export files",
    data: "Uploaded files and generated documents",
    region: "Configured production region",
  },
  {
    name: "Email delivery provider",
    purpose: "Account, billing, and operational notifications",
    data: "Recipient contact details and message content",
    region: "Provider region",
  },
  {
    name: "SMS / WhatsApp messaging provider",
    purpose: "Tenant and staff notifications when enabled",
    data: "Phone numbers and notification content",
    region: "Provider region",
  },
  {
    name: "Payment infrastructure",
    purpose: "M-Pesa, bank reconciliation, and payment callbacks when enabled",
    data: "Payment references, payer metadata, callback payloads",
    region: "Kenya / provider region",
  },
  {
    name: "Error monitoring provider",
    purpose: "Application reliability and incident response",
    data: "Technical logs, request metadata, and error context",
    region: "Provider region",
  },
] as const;

export const dataSubjectRequestProcess = [
  "Organizations should route tenant and staff data-subject requests through their own privacy contact first.",
  "EstateDesk platform operators should document export, correction, restriction, and deletion workflows before enterprise rollout.",
  "Deletion requests must be reviewed against tenancy, tax, payment, audit, and legal retention obligations.",
] as const;

export const breachResponseOutline = [
  "Contain the incident and preserve audit evidence.",
  "Assess affected organizations, tenants, staff, and record categories.",
  "Notify affected customers and, where required, regulators within applicable timelines.",
  "Record remediation actions, root cause, and follow-up controls in the operations runbook.",
] as const;