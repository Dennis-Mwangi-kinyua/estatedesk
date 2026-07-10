"use server";

import { revalidatePath } from "next/cache";
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

  try {
    const result = await importCsv({
      orgId: session.activeOrgId!,
      kind: kindValue,
      csv,
      dryRun: mode !== "commit",
    });

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
      message: result.dryRun
        ? result.ok
          ? `Validation passed for ${result.totalRows} row${result.totalRows === 1 ? "" : "s"}.`
          : "Validation found issues. Fix the CSV and try again."
        : `Imported ${result.created} ${kindValue} row${result.created === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    const message = safeClientMessage(error, "CSV import failed.");
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
    });

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
