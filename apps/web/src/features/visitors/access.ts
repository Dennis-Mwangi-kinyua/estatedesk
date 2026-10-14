import "server-only";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
export async function gateAccess() {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE", "CARETAKER", "SECURITY"]);
  const orgId = session.activeOrgId!;
  const assignments = await prisma.gateAssignment.findMany({ where: { orgId, userId: session.userId }, select: { propertyId: true } });
  const manager = session.activeOrgRole === "ADMIN" || session.activeOrgRole === "MANAGER";
  return { session, orgId, propertyIds: assignments.map(a => a.propertyId), manager };
}
