"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureAccountingFoundation } from "@/lib/accounting/engine";
import {
  ensureFiscalYearPeriods,
  getPeriodCloseChecklist,
  nextPeriodStatus,
} from "@/lib/accounting/periods";
import { postPeriodCloseEntries } from "@/lib/accounting/period-close";
import { getAccountingSettings } from "@/lib/accounting/settings";
import { runYearEndClose } from "@/lib/accounting/year-end-close";
import { summarizeYearEndResult } from "@/lib/accounting/year-end-close-policy";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";

const PATH = "/dashboard/org/accounting/periods";
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

async function accountingSession() {
  return requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
}

function revalidatePeriods() {
  revalidatePath(PATH);
  revalidatePath("/dashboard/org/accounting");
  revalidatePath("/dashboard/org/accounting/budgets");
  revalidatePath("/dashboard/org/accounting/journals");
  revalidatePath("/dashboard/org/accounting/reports");
}

export async function generatePeriodsAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const year = Number(text(formData, "year"));

  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    throw new Error("Enter a valid fiscal year.");
  }

  await prisma.$transaction(async (tx) => {
    await ensureAccountingFoundation(tx, orgId);
    const settings = await getAccountingSettings(tx, orgId);
    await ensureFiscalYearPeriods(tx, orgId, year, settings.fiscalYearStartMonth);
  });

  revalidatePeriods();
  redirect(`${PATH}?message=Fiscal year ${year} periods generated`);
}

export async function updatePeriodStatusAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const periodId = text(formData, "periodId");
  const action = text(formData, "action") as "lock" | "close" | "reopen";
  const closeNotes = text(formData, "closeNotes") || null;

  const period = await prisma.accountingPeriod.findFirst({
    where: { id: periodId, orgId },
  });

  if (!period) {
    throw new Error("Accounting period was not found.");
  }

  if (action === "close") {
    const checklist = await getPeriodCloseChecklist(prisma, orgId, periodId);
    if (!checklist.canClose) {
      throw new Error(checklist.blockers.join("; "));
    }
  }

  const status = nextPeriodStatus(period.status, action);

  await prisma.accountingPeriod.update({
    where: { id: periodId },
    data: {
      status,
      ...(action === "close"
        ? {
            closedAt: new Date(),
            closedByUserId: session.userId,
            closeNotes,
          }
        : {}),
      ...(action === "reopen"
        ? {
            closedAt: null,
            closedByUserId: null,
            closeNotes: null,
          }
        : {}),
    },
  });

  revalidatePeriods();
  redirect(`${PATH}?message=Period ${period.name} is now ${status}`);
}

export async function postPeriodCloseEntriesAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const periodId = text(formData, "periodId");

  const entry = await postPeriodCloseEntries(prisma, orgId, periodId, session.userId);

  revalidatePeriods();
  redirect(
    `${PATH}?message=${entry ? "Closing entries posted for period" : "No income or expense activity to close for this period"}`,
  );
}

export async function runYearEndCloseAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const year = Number(text(formData, "year"));
  const openNextYear = text(formData, "openNextYear") === "on";

  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    throw new Error("Enter a valid fiscal year.");
  }

  const result = await runYearEndClose(prisma, orgId, year, session.userId, {
    openNextYear,
  });

  revalidatePeriods();
  redirect(`${PATH}?message=${summarizeYearEndResult(result)}`);
}