import { requireManagementAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/errors/server-error-log";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { ImportsWorkspace } from "./_components/imports-workspace";
import type { ImportHistoryItem } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function OrgImportsPage() {
  const session = await requireManagementAccess();
  let history: ImportHistoryItem[] = [];
  let historyUnavailable = false;

  try {
    history = await retryTransientDatabaseOperation(
      () => getImportHistory(session.activeOrgId!),
      { label: "org-import-history", attempts: 3, delayMs: 350 },
    );
  } catch (error) {
    historyUnavailable = true;
    logServerError("orgImports.history", error, { orgId: session.activeOrgId });
  }

  return (
    <ImportsWorkspace
      history={history}
      historyUnavailable={historyUnavailable}
      orgRole={session.activeOrgRole}
    />
  );
}

function getImportHistory(orgId: string) {
  return prisma.importRun.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      kind: true,
      mode: true,
      status: true,
      totalRows: true,
      createdRows: true,
      errorCount: true,
      rollbackSummary: true,
      createdAt: true,
    },
  });
}