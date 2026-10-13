import "server-only";
import { cache } from "react";
import type { ScopeType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCaretakerAllowedUnitIds } from "./access";
import { caretakerWorkspaceSections } from "./workspace-policy";

export const getCaretakerWorkspaceScope = cache(async (orgId: string, userId: string, scopeType?: ScopeType, scopeId?: string) => {
  const [unitIds, issue, inspection] = await Promise.all([
    getCaretakerAllowedUnitIds({ orgId, caretakerUserId: userId, membershipScope: scopeType && scopeId ? { scopeType, scopeId } : null }),
    prisma.issueTicket.findFirst({ where: { orgId, assignedToUserId: userId }, select: { id: true } }),
    prisma.inspection.findFirst({ where: { inspectorUserId: userId, notice: { lease: { orgId, deletedAt: null } } }, select: { id: true } }),
  ]);
  return { unitIds, sections: caretakerWorkspaceSections({ hasUnits: unitIds.length > 0, hasIssues: Boolean(issue), hasInspections: Boolean(inspection) }) };
});
