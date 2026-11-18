import { notFound } from "next/navigation";
import Link from "@/components/navigation/workspace-link";
import { PageShell, SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { SettlementSummary } from "@/features/move-outs/components/settlement-summary";
import { loadMoveOutBalances } from "@/lib/move-outs/balances";
import { moveOutDocumentWhere } from "@/lib/move-outs/document-access";
import { nairobiDate } from "@/lib/move-outs/validation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { decodePublicId } from "@/lib/public-id";

export default async function MoveOutStatementPage({ params }: { params: Promise<{ noticeId: string }> }) {
  const session = await requireTenantAccess();
  const { noticeId } = await params;
  let id: string;
  try {
    id = decodePublicId(noticeId, "move-out-notice");
  } catch {
    notFound();
  }
  const where = moveOutDocumentWhere(session, id);
  if (!where) notFound();
  const notice = await prisma.moveOutNotice.findFirst({
    where: { ...where, status: "CLOSED" },
    select: {
      referenceCode: true, actualMoveOutDate: true, moveOutDate: true, closeout: true,
      lease: { include: { org: { select: { currencyCode: true } }, unit: { select: { houseNo: true, property: { select: { name: true } } } } } },
    },
  });
  if (!notice) notFound();

  const { lease } = notice;
  const handoverDate = notice.actualMoveOutDate ?? notice.moveOutDate;
  const balances = await loadMoveOutBalances(prisma, lease, handoverDate);
  const money = new Intl.NumberFormat("en-KE", { style: "currency", currency: lease.org.currencyCode });
  const lines = [
    ...balances.charges.map(charge => ({ id: charge.id, label: charge.description || charge.chargeType.replaceAll("_", " "), period: charge.period, balance: Number(charge.balance) })),
    ...balances.water.map(bill => ({ id: bill.id, label: "Water", period: bill.period, balance: bill.remainingCents / 100 })),
  ];

  return (
    <PageShell>
      <div className="space-y-4">
        <header>
          <Link href="/dashboard/tenant/history#move-outs" className="inline-flex min-h-11 items-center text-sm text-primary underline">Back to move-out history</Link>
          <h1 className="text-2xl font-bold">Final move-out statement</h1>
          <p className="mt-1 text-sm text-muted-foreground">{lease.unit.property.name} · Unit {lease.unit.houseNo} · {nairobiDate(handoverDate)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Reference {notice.referenceCode}</p>
        </header>
        <SurfaceCard className="space-y-3 p-4">
          <h2 className="text-lg font-semibold">Settlement at handover ({lease.org.currencyCode})</h2>
          {notice.closeout ? <SettlementSummary closeout={notice.closeout} /> : <p className="text-sm">Settlement details are unavailable for this move-out.</p>}
        </SurfaceCard>
        <SurfaceCard className="space-y-3 p-4">
          <h2 className="text-lg font-semibold">Current unpaid balance</h2>
          <p className="text-2xl font-bold">{money.format(balances.totalCents / 100)}</p>
          {lines.length ? (
            <ul className="divide-y divide-border text-sm">
              {lines.map(line => <li key={line.id} className="flex flex-wrap justify-between gap-x-4 py-2"><span className="min-w-0 break-words">{line.period} · {line.label}</span><span>{money.format(line.balance)}</span></li>)}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No unpaid bills through handover.</p>}
        </SurfaceCard>
        <a href={`/api/move-outs/${noticeId}/report`} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Download final statement PDF</a>
      </div>
    </PageShell>
  );
}
