import { BookOpen, Landmark, ReceiptText, Scale, TrendingUp, WalletCards } from "lucide-react";
import { getFinancialSummary } from "@/lib/accounting/reports";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { createManualJournalAction, createVendorAction, initializeAccountingAction, recordExpenseAction } from "./actions";

export const dynamic = "force-dynamic";
const money = (value: number, currency = "KES") => new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(value);
const input = "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm";

export default async function AccountingPage() {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const [org, accounts, vendors, journals, bills] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: orgId }, select: { currencyCode: true } }),
    prisma.accountingAccount.findMany({ where: { orgId, isActive: true }, orderBy: { code: "asc" } }),
    prisma.accountingVendor.findMany({ where: { orgId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.accountingJournalEntry.findMany({ where: { orgId }, include: { lines: { include: { account: true } } }, orderBy: { entryDate: "desc" }, take: 12 }),
    prisma.accountingVendorBill.findMany({ where: { orgId }, include: { vendor: true }, orderBy: { billDate: "desc" }, take: 8 }),
  ]);
  if (!accounts.length) return (
    <main className="mx-auto max-w-3xl p-6 sm:p-10">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8">
        <BookOpen className="h-10 w-10 text-emerald-700" />
        <h1 className="mt-5 text-3xl font-bold">Set up accounting</h1>
        <p className="mt-3 text-neutral-600">Create the chart of accounts and current fiscal period. Existing verified payments will post automatically going forward.</p>
        <form action={initializeAccountingAction}><button className="mt-6 rounded-lg bg-neutral-950 px-5 py-3 text-sm font-semibold text-white">Initialize accounting ledger</button></form>
      </div>
    </main>
  );
  const now = new Date();
  const summary = await getFinancialSummary(prisma, orgId, new Date(Date.UTC(now.getUTCFullYear(), 0, 1)), now);
  const expenseAccounts = accounts.filter((account) => account.type === "EXPENSE");
  const cards = [
    { label: "Income", value: summary.income, Icon: TrendingUp },
    { label: "Expenses", value: summary.expenses, Icon: ReceiptText },
    { label: "Net income", value: summary.netIncome, Icon: Scale },
    { label: "Assets", value: summary.assets, Icon: Landmark },
  ];
  return (
    <main className="space-y-8 p-4 sm:p-6 lg:p-8">
      <header><p className="text-sm font-semibold text-emerald-700">Double-entry general ledger</p><h1 className="mt-1 text-3xl font-bold">Accounting</h1><p className="mt-2 text-neutral-600">Books, expenses, vendors, balances, and property finance in one database.</p></header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, Icon }) => <div key={label} className="rounded-xl border bg-white p-5"><Icon className="h-5 w-5 text-emerald-700" /><p className="mt-4 text-sm text-neutral-500">{label}</p><p className="mt-1 text-xl font-bold">{money(value, org.currencyCode)}</p></div>)}
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <form action={recordExpenseAction} className="rounded-xl border bg-white p-5"><h2 className="text-lg font-bold">Record paid expense</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm">Vendor<select name="vendorId" required className={input}><option value="">Select vendor</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label><label className="text-sm">Expense account<select name="accountId" required className={input}><option value="">Select account</option>{expenseAccounts.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select></label><label className="text-sm">Date<input name="date" type="date" required defaultValue={now.toISOString().slice(0,10)} className={input}/></label><label className="text-sm">Amount<input name="amount" type="number" min="0.01" step="0.01" required className={input}/></label><label className="text-sm sm:col-span-2">Description<input name="description" required className={input}/></label><label className="text-sm">Bill/reference number<input name="billNumber" className={input}/></label><label className="text-sm">Notes<input name="notes" className={input}/></label></div><button className="mt-4 rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white">Post expense</button></form>
        <form action={createVendorAction} className="rounded-xl border bg-white p-5"><h2 className="text-lg font-bold">Add vendor</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{[["name","Vendor name"],["contactPerson","Contact person"],["phone","Phone"],["email","Email"],["kraPin","KRA PIN"]].map(([name,label]) => <label key={name} className="text-sm">{label}<input name={name} required={name === "name"} className={input}/></label>)}</div><button className="mt-4 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold">Save vendor</button><div className="mt-6 space-y-2">{vendors.map(v => <div key={v.id} className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"><span>{v.name}</span><span className="text-neutral-500">{v.kraPin ?? v.phone ?? "—"}</span></div>)}</div></form>
      </section>
      <form action={createManualJournalAction} className="rounded-xl border bg-white p-5"><h2 className="text-lg font-bold">Manual journal</h2><div className="mt-4 grid gap-3 md:grid-cols-5"><label className="text-sm">Date<input name="date" type="date" required defaultValue={now.toISOString().slice(0,10)} className={input}/></label><label className="text-sm">Debit<select name="debitAccountId" required className={input}>{accounts.map(a=><option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select></label><label className="text-sm">Credit<select name="creditAccountId" required className={input}>{accounts.map(a=><option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select></label><label className="text-sm">Amount<input name="amount" type="number" min="0.01" step="0.01" required className={input}/></label><label className="text-sm">Description<input name="description" required className={input}/></label></div><button className="mt-4 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold">Post journal</button></form>
      <section className="grid gap-6 xl:grid-cols-2"><div className="rounded-xl border bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><WalletCards className="h-5 w-5"/>Recent journals</h2><div className="mt-4 space-y-3">{journals.map(j => <div key={j.id} className="border-b pb-3"><div className="flex justify-between gap-4 text-sm font-semibold"><span>{j.description}</span><span>{j.entryNumber}</span></div><p className="mt-1 text-xs text-neutral-500">{j.entryDate.toLocaleDateString("en-KE")} · {j.status} · {j.sourceType}</p></div>)}</div></div><div className="rounded-xl border bg-white p-5"><h2 className="text-lg font-bold">Vendor bills and expenses</h2><div className="mt-4 space-y-3">{bills.map(b => <div key={b.id} className="flex justify-between border-b pb-3 text-sm"><span><b>{b.vendor.name}</b><br/><span className="text-neutral-500">{b.billNumber} · {b.status}</span></span><b>{money(Number(b.total), b.currencyCode)}</b></div>)}</div></div></section>
      <section className="rounded-xl border bg-white p-5"><h2 className="text-lg font-bold">Trial balance</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-neutral-500"><th className="py-2">Account</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>{summary.rows.map(row => <tr key={row.code} className="border-b"><td className="py-2">{row.code} · {row.name}</td><td>{money(row.debit,org.currencyCode)}</td><td>{money(row.credit,org.currencyCode)}</td><td>{money(row.debit-row.credit,org.currencyCode)}</td></tr>)}</tbody></table></div></section>
    </main>
  );
}
