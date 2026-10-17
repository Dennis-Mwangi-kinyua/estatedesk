import Link from "@/components/navigation/workspace-link";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { agreementData, AGREEMENT_ENTITY } from "@/lib/service-agreements/contract";
import { Badge, PageHeader, Surface, formatDateTime } from "@/app/(app)/platform/_components/control-plane";
export const dynamic = "force-dynamic";
export default async function Page() {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  const documents = await prisma.documentRecord.findMany({ where: { orgId: session.activeOrgId!, entityType: AGREEMENT_ENTITY, status: { in: ["ISSUED", "COMPLETED"] } }, orderBy: { issuedAt: "desc" }, take: 50 });
  return <div className="engineering-workspace mx-auto min-w-0 w-full max-w-7xl space-y-6"><PageHeader eyebrow="Organization administration" title="Service agreements" description="Review and sign for your organization first. Download the completed agreement after EstateDesk countersigns." /><Surface title="Your agreements"><div className="engineering-record-grid">{documents.map(doc => <Link key={doc.id} href={`/dashboard/org/agreements/${doc.id}`} className="space-y-3 rounded-xl border p-5"><Badge>{doc.status === "ISSUED" ? agreementData(doc.metadata).organizationSignature ? "AWAITING PLATFORM SIGNATURE" : "YOUR SIGNATURE REQUIRED" : "COMPLETED"}</Badge><h2 className="text-base font-semibold">{doc.title}</h2><p className="text-sm text-muted-foreground">Sent {formatDateTime(doc.issuedAt)}</p><p className="text-sm font-semibold">Review and download →</p></Link>)}{!documents.length ? <p className="text-sm text-muted-foreground">EstateDesk has not sent any service agreements to this organization yet.</p> : null}</div></Surface></div>;
}
