"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createJournalEntry,
  postDraftJournalEntry,
  reverseManualJournalEntry,
} from "@/lib/accounting/engine";
import { parseJournalLinesPayload } from "@/lib/accounting/journal-lines";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";

const PATH = "/dashboard/org/accounting/journals";
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

async function accountingSession() {
  return requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
}

function revalidateJournals() {
  revalidatePath(PATH);
  revalidatePath("/dashboard/org/accounting");
}

export async function createMultiLineJournalAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const description = text(formData, "description");
  const memo = text(formData, "memo") || null;
  const date = new Date(text(formData, "date"));
  const mode = text(formData, "mode") || "post";
  const lines = parseJournalLinesPayload(text(formData, "linesJson"));

  if (description.length < 3 || Number.isNaN(date.getTime())) {
    throw new Error("Complete the journal header details.");
  }

  const status = mode === "draft" ? "DRAFT" : "POSTED";

  await createJournalEntry({
    db: prisma,
    orgId,
    entryDate: date,
    description,
    memo,
    sourceType: "MANUAL",
    userId: session.userId,
    status,
    lines,
  });

  revalidateJournals();
  redirect(
    `${PATH}?message=${status === "DRAFT" ? "Draft journal saved" : "Journal posted"}`,
  );
}

export async function postDraftJournalAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const journalId = text(formData, "journalId");

  if (!journalId) {
    throw new Error("Journal id is required.");
  }

  await postDraftJournalEntry(prisma, journalId, orgId, session.userId);
  revalidateJournals();
  redirect(`${PATH}?message=Draft journal posted`);
}

export async function reverseJournalAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const journalId = text(formData, "journalId");
  const reason = text(formData, "reason");

  if (!journalId || reason.length < 5) {
    throw new Error("Provide a journal and reversal reason.");
  }

  await reverseManualJournalEntry({
    db: prisma,
    orgId,
    journalId,
    reason,
    userId: session.userId,
  });

  revalidateJournals();
  redirect(`${PATH}?message=Journal reversed`);
}