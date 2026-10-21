import "server-only";
import type { AppSession } from "@/lib/auth/session";
import type { NativeActionDefinition, NativeActionLink } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { createMultiLineJournalAction } from "@/app/(app)/dashboard/org/accounting/journal-actions";
import { createAccountingAccountAction, updateAccountingAccountAction } from "@/app/(app)/dashboard/org/accounting/coa-actions";
import { createVendorAction, recordExpenseAction, recordVendorBillAction } from "@/app/(app)/dashboard/org/accounting/actions";
import { nativeOrgWideAccess } from "./native-workspace-policy";

const allowedRoles = ["ADMIN", "MANAGER", "ACCOUNTANT"] as const;
function canManageAccounting(session: AppSession) {
  return !!session.activeOrgId && nativeOrgWideAccess(session.membershipScope) && allowedRoles.includes(session.activeOrgRole as typeof allowedRoles[number]);
}

export function nativeAccountingPageActions(session: AppSession, kind: "organization" | "platform", path: string): NativeActionLink[] {
  if (kind !== "organization" || !canManageAccounting(session)) return [];
  if (path === "/dashboard/org/accounting") return [
    { id: "accounting.vendor.create", title: "Add vendor" },
    { id: "accounting.expense.create", title: "Record paid expense" },
    { id: "accounting.bill.create", title: "Record vendor bill" },
  ];
  if (path === "/dashboard/org/accounting/journals") return [{ id: "accounting.journal.create", title: "New journal entry" }];
  if (path === "/dashboard/org/accounting/coa") return [{ id: "accounting.account.create", title: "New account" }];
  return [];
}

export async function nativeAccountingActionDefinition(session: AppSession, kind: "organization" | "platform", path: string, actionId: string, recordId?: string): Promise<NativeActionDefinition | null> {
  if (kind !== "organization" || !canManageAccounting(session)) return null;
  if (path === "/dashboard/org/accounting" && actionId === "accounting.vendor.create") return {
    id: actionId, title: "Add accounting vendor", description: "Save a vendor for this organization's payables and expense records.", submitLabel: "Add vendor", confirmation: "Add this vendor to the organization accounting records?",
    groups: [{ id: "vendor", title: "Vendor details", fields: [
      { name: "name", label: "Vendor name", type: "text", required: true, maxLength: 160 },
      { name: "contactPerson", label: "Contact person", type: "text", maxLength: 120 },
      { name: "phone", label: "Phone", type: "phone", maxLength: 40 },
      { name: "email", label: "Email", type: "email", maxLength: 180 },
      { name: "kraPin", label: "KRA PIN", type: "text", maxLength: 40 },
    ] }],
  };
  if (path === "/dashboard/org/accounting" && ["accounting.expense.create", "accounting.bill.create"].includes(actionId)) {
    const [vendors, accounts, properties] = await Promise.all([
      prisma.accountingVendor.findMany({ where: { orgId: session.activeOrgId! }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.accountingAccount.findMany({ where: { orgId: session.activeOrgId!, isActive: true, type: "EXPENSE" }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
      prisma.property.findMany({ where: { orgId: session.activeOrgId!, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const bill = actionId === "accounting.bill.create";
    return { id: actionId, title: bill ? "Record vendor bill" : "Record paid expense", description: bill ? "Record an approved bill in accounts payable." : "Record a paid vendor expense and post its ledger entry.", submitLabel: bill ? "Save vendor bill" : "Record expense", confirmation: bill ? "Save this bill and post it to accounts payable?" : "Record this payment and post it to the ledger?", groups: [{ id: "details", title: "Expense details", fields: [
      { name: "vendorId", label: "Vendor", type: "select", required: true, options: vendors.map(v => ({ value: v.id, label: v.name })) },
      { name: "accountId", label: "Expense account", type: "select", required: true, options: accounts.map(a => ({ value: a.id, label: `${a.code} · ${a.name}` })) },
      { name: "propertyId", label: "Property (optional)", type: "select", options: [{ value: "", label: "Portfolio-wide" }, ...properties.map(p => ({ value: p.id, label: p.name }))] },
      { name: "description", label: "Description", type: "text", required: true, maxLength: 240 },
      { name: "amount", label: "Amount", type: "decimal", required: true, maxLength: 20 },
      { name: bill ? "billDate" : "date", label: bill ? "Bill date" : "Payment date", type: "date", required: true, defaultValue: today },
      ...(bill ? [{ name: "dueDate", label: "Due date", type: "date", required: true, defaultValue: today } as const] : [{ name: "paymentMethod", label: "Paid from", type: "select" as const, defaultValue: "BANK", options: [{ value: "BANK", label: "Bank" }, { value: "MPESA", label: "M-Pesa" }, { value: "CASH", label: "Cash" }] }]),
      { name: "billNumber", label: "Reference (optional)", type: "text", maxLength: 80 },
      { name: "notes", label: "Notes", type: "multiline", maxLength: 1200 },
    ] }] };
  }
  if (path === "/dashboard/org/accounting/coa" && actionId === "accounting.account.create") {
    const parents = await prisma.accountingAccount.findMany({ where: { orgId: session.activeOrgId!, isActive: true }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } });
    return { id: actionId, title: "Create accounting account", description: "Add an organization-scoped account to the chart of accounts.", submitLabel: "Create account", confirmation: "Create this account? The account code must be unique in this organization.", groups: [{ id: "account", title: "Account details", fields: [
      { name: "code", label: "Account code", type: "text", required: true, maxLength: 20 },
      { name: "name", label: "Account name", type: "text", required: true, maxLength: 120 },
      { name: "type", label: "Account type", type: "select", required: true, defaultValue: "ASSET", options: ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].map(value => ({ value, label: value })) },
      { name: "parentId", label: "Parent account (optional)", type: "select", options: [{ value: "", label: "No parent" }, ...parents.map(item => ({ value: item.id, label: `${item.code} · ${item.name}` }))] },
      { name: "description", label: "Description", type: "multiline", maxLength: 500 },
    ] }] };
  }
  if (path === "/dashboard/org/accounting/coa" && actionId === "accounting.account.update" && recordId) {
    const account = await prisma.accountingAccount.findFirst({ where: { id: recordId, orgId: session.activeOrgId! }, select: { id: true, code: true, name: true, description: true, parentId: true, type: true } });
    if (!account) return null;
    const parents = await prisma.accountingAccount.findMany({ where: { orgId: session.activeOrgId!, isActive: true, type: account.type, id: { not: recordId } }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } });
    return { id: actionId, title: `Edit ${account.code} · ${account.name}`, description: "Update the account label and chart hierarchy.", submitLabel: "Save account", confirmation: "Save these account changes? Journal history remains unchanged.", groups: [{ id: "account", title: "Account details", fields: [
      { name: "name", label: "Account name", type: "text", required: true, maxLength: 120, defaultValue: account.name },
      { name: "parentId", label: "Parent account (optional)", type: "select", defaultValue: account.parentId ?? "", options: [{ value: "", label: "No parent" }, ...parents.map(item => ({ value: item.id, label: `${item.code} · ${item.name}` }))] },
      { name: "description", label: "Description", type: "multiline", maxLength: 500, defaultValue: account.description ?? "" },
    ] }] };
  }
  if (path !== "/dashboard/org/accounting/journals" || actionId !== "accounting.journal.create") return null;
  const accounts = await prisma.accountingAccount.findMany({
    where: { orgId: session.activeOrgId!, isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
  if (accounts.length < 2) return null;
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: actionId,
    title: "New manual journal",
    description: "Create a balanced journal entry using active accounts in this organization.",
    submitLabel: "Review and save journal",
    confirmation: "Save this journal entry? Posted entries affect the ledger immediately; drafts can be posted later.",
    groups: [
      { id: "header", title: "Journal details", fields: [
        { name: "date", label: "Entry date", type: "date", required: true, defaultValue: today },
        { name: "description", label: "Description", type: "text", required: true, maxLength: 200 },
        { name: "memo", label: "Memo", type: "text", maxLength: 1000 },
        { name: "mode", label: "Save as", type: "select", required: true, defaultValue: "draft", options: [{ value: "draft", label: "Save draft" }, { value: "post", label: "Post to ledger" }] },
      ] },
      { id: "lines", title: "Journal lines", description: "Add at least two lines. Each line needs one debit or one credit; total debits and credits must match.", repeat: true, fields: [
        { name: "accountId", label: "Account", type: "select", required: true, options: accounts.map(account => ({ value: account.id, label: `${account.code} · ${account.name}` })) },
        { name: "debit", label: "Debit amount", type: "decimal", maxLength: 20 },
        { name: "credit", label: "Credit amount", type: "decimal", maxLength: 20 },
        { name: "lineDescription", label: "Line note", type: "text", maxLength: 200 },
      ] },
    ],
  };
}

export async function executeNativeAccountingAction(kind: "organization" | "platform", path: string, actionId: string, recordId: string | undefined, form: FormData) {
  if (kind !== "organization") return null;
  if (path === "/dashboard/org/accounting" && actionId === "accounting.vendor.create") {
    await createVendorAction(form);
    return { ok: true as const, message: "Vendor added." };
  }
  if (path === "/dashboard/org/accounting" && actionId === "accounting.expense.create") {
    await recordExpenseAction(form);
    return { ok: true as const, message: "Expense recorded." };
  }
  if (path === "/dashboard/org/accounting" && actionId === "accounting.bill.create") {
    await recordVendorBillAction(form);
    return { ok: true as const, message: "Vendor bill recorded." };
  }
  if (path === "/dashboard/org/accounting/coa" && actionId === "accounting.account.create") {
    await createAccountingAccountAction(form);
    return { ok: true as const, message: "Accounting account created." };
  }
  if (path === "/dashboard/org/accounting/coa" && actionId === "accounting.account.update") {
    if (!recordId) throw new Error("Account could not be identified.");
    form.set("accountId", recordId);
    await updateAccountingAccountAction(form);
    return { ok: true as const, message: "Accounting account updated." };
  }
  if (path !== "/dashboard/org/accounting/journals" || actionId !== "accounting.journal.create") return null;
  const accountIds = form.getAll("accountId").map(String);
  const debits = form.getAll("debit").map(String);
  const credits = form.getAll("credit").map(String);
  const descriptions = form.getAll("lineDescription").map(String);
  if (accountIds.length !== debits.length || accountIds.length !== credits.length || accountIds.length !== descriptions.length) throw new Error("Journal lines are incomplete. Review each line and try again.");
  const lines = accountIds.map((accountId, index) => ({
    accountId,
    debit: Number(debits[index]) || 0,
    credit: Number(credits[index]) || 0,
    description: descriptions[index].trim() || undefined,
  })).filter(line => line.accountId || line.debit || line.credit || line.description);
  form.set("linesJson", JSON.stringify(lines));
  form.delete("accountId"); form.delete("debit"); form.delete("credit"); form.delete("lineDescription");
  await createMultiLineJournalAction(form);
  return { ok: true as const, message: "Journal entry saved." };
}
