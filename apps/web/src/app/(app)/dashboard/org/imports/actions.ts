"use server";

import { revalidatePath } from "next/cache";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import { parseCsv } from "@/lib/csv";
import { issueImportValidation, verifyImportValidation } from "@/lib/imports/validation-receipt";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { safeClientMessage } from "@/lib/errors/client-safe-error";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { importCsv } from "@/lib/imports/csv-import";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";
import { IMPORT_TEMPLATES } from "@/lib/imports/templates";
import type { ImportKind } from "@/lib/imports/types";
import {
  initialImportState,
  type ImportActionState,
} from "./import-state";

export type { ImportActionState } from "./import-state";

function isImportKind(value: FormDataEntryValue | null): value is ImportKind {
  return value === "properties" || value === "units" || value === "tenants";
}

export async function runCsvImportAction(
  _state: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const session = await requireManagementAccess();
  const kindValue = formData.get("kind");
  const csv = String(formData.get("csv") ?? "");
  const mode = String(formData.get("mode") ?? "dry-run");

  if (!isImportKind(kindValue)) {
    return {
      ...initialImportState,
      ok: false,
      message: "Choose a valid import type.",
      errors: ["Invalid import type."],
      rowResults: [],
    };
  }

  if (session.membershipScope?.scopeType !== "ORG" || !canAccessWorkspacePath(session, "/dashboard/org/imports") || !canAccessWorkspacePath(session, `/dashboard/org/${kindValue}`) || !memberHasOrgPermission(session, kindValue === "tenants" ? "tenants.manage" : "properties.manage")) return { ...initialImportState, ok: false, message: "Organization-wide access and permission to manage these records are required.", errors: ["Import access denied."] };
  await requireActiveSubscription(session.activeOrgId!);
  const receiptInput = { orgId: session.activeOrgId!, actorId: session.userId, kind: kindValue, csv };
  if (mode === "commit" && (formData.get("confirmImport") !== "yes" || !verifyImportValidation(String(formData.get("validationToken") ?? ""), receiptInput, process.env.AUTH_SECRET ?? ""))) return { ...initialImportState, ok: false, message: "Validate this exact CSV, then confirm the import. Previews expire after 15 minutes.", errors: ["A valid preview and explicit confirmation are required."] };

  let committedResult: Awaited<ReturnType<typeof importCsv>> | undefined;
  try {
    if (kindValue === "tenants" && parseCsv(csv).some(row => row.propertyName || row.unitHouseNo) && (!memberHasOrgPermission(session, "leases.manage") || !canAccessWorkspacePath(session, "/dashboard/org/leases"))) return { ...initialImportState, ok: false, message: "Lease-management permission is required when importing unit assignments.", errors: ["Lease-management access denied."] };
    const result = await importCsv({
      orgId: session.activeOrgId!,
      kind: kindValue,
      csv,
      dryRun: mode !== "commit",
    });

    if (result.ok && !result.dryRun) committedResult = result;
    const run = await prisma.importRun.create({
      data: {
        orgId: session.activeOrgId!,
        actorUserId: session.userId,
        kind: kindValue,
        mode: result.dryRun ? "DRY_RUN" : "COMMIT",
        status: result.ok ? "COMPLETED" : "FAILED",
        totalRows: result.totalRows,
        validRows: result.validRows,
        createdRows: result.created,
        errorCount: result.errors.length,
        errors: result.errors,
        rowResults: result.rowResults,
        rollbackSummary: result.rollbackSummary,
        completedAt: new Date(),
      },
      select: { id: true },
    });

    if (result.ok && !result.dryRun) {
      revalidatePath("/dashboard/org");
      revalidatePath("/dashboard/org/setup");
      revalidatePath("/dashboard/org/properties");
      revalidatePath("/dashboard/org/units");
      revalidatePath("/dashboard/org/tenants");
      revalidatePath("/dashboard/org/reports");
      revalidatePath("/dashboard/org/imports");

      if (kindValue === "units" || kindValue === "tenants") {
        revalidatePublicVacancies();
      }
    }

    return {
      ...initialImportState,
      ...result,
      errors: result.errors ?? [],
      preview: result.preview ?? [],
      rowResults: result.rowResults ?? [],
      runId: run.id,
      validationToken: result.ok && result.dryRun ? issueImportValidation(receiptInput, process.env.AUTH_SECRET ?? "") : undefined,
      message: result.dryRun
        ? result.ok
          ? `Validation passed for ${result.totalRows} row${result.totalRows === 1 ? "" : "s"}.`
          : "Validation found issues. Fix the CSV and try again."
        : `Imported ${result.created} ${kindValue} row${result.created === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    if (committedResult) {
      logServerError("orgCsvImportAction.history", error);
      for (const path of ["/dashboard/org", "/dashboard/org/setup", "/dashboard/org/imports", "/dashboard/org/properties", "/dashboard/org/units", "/dashboard/org/tenants"]) revalidatePath(path);
      revalidatePublicVacancies();
      return { ...committedResult, message: `Imported ${committedResult.created} records, but the import history could not be saved. Review the records before trying again.`, validationToken: undefined };
    }
    const known = error instanceof Error && /^(CSV |A CSV |Line \d+:|Unit not found:)/.test(error.message);
    const message = known ? error.message : safeClientMessage(error, "CSV import failed.");
    if (message === "CSV import failed.") {
      logServerError("orgCsvImportAction", error);
    }
    await prisma.importRun.create({
      data: {
        orgId: session.activeOrgId!,
        actorUserId: session.userId,
        kind: kindValue,
        mode: mode === "commit" ? "COMMIT" : "DRY_RUN",
        status: "FAILED",
        totalRows: 0,
        validRows: 0,
        createdRows: 0,
        errorCount: 1,
        errors: [message],
        rollbackSummary:
          mode === "commit"
            ? "The transaction was rolled back. No partial records were committed."
            : "No records were written.",
        completedAt: new Date(),
      },
    }).catch(historyError => logServerError("orgCsvImportAction.failedHistory", historyError));

    return {
      ok: false,
      dryRun: mode !== "commit",
      kind: kindValue,
      totalRows: 0,
      validRows: 0,
      created: 0,
      errors: [message],
      preview: [],
      rowResults: [],
      rollbackSummary:
        mode === "commit"
          ? "The transaction was rolled back. No partial records were committed."
          : "No records were written.",
      message: "Import failed. Review duplicates, required columns, and related records.",
    };
  }
}

export async function getImportTemplate(kind: ImportKind) {
  return IMPORT_TEMPLATES[kind];
}
