import type { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "@/components/navigation/workspace-link";
import { PageShell, SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { StkStatusCheck } from "../_components/stk-status-check";
import { formatDate, formatMoney } from "../_lib/helpers";

const attemptFields = {
  id: true, amount: true, reference: true, createdAt: true,
  checkoutRequestId: true, gatewayStatus: true, verificationStatus: true, reversedAt: true,
  receipt: { select: { id: true } },
} satisfies Prisma.PaymentSelect;

type Attempt = Prisma.PaymentGetPayload<{ select: typeof attemptFields }>;

function describeAttempt(attempt: Attempt) {
  if (attempt.reversedAt || attempt.verificationStatus === "REVERSED") return { title: "Payment reversed", detail: "Check your balance or contact your property manager." };
  if (["FAILED", "CANCELLED"].includes(attempt.gatewayStatus) || attempt.verificationStatus === "REJECTED") return { title: "Payment unsuccessful", detail: "Check your payment history and M-Pesa messages before trying again." };
  if (attempt.gatewayStatus === "SUCCESS") return { title: "Payment confirmed", detail: "Check your payment history for how this payment was applied." };
  if (!attempt.checkoutRequestId) return { title: "Confirmation unavailable", detail: "M-Pesa did not provide a tracking ID. Check your M-Pesa messages and contact your property manager before trying again." };
  return { title: "Awaiting M-Pesa confirmation", detail: "Check this attempt before starting another payment." };
}

export default async function PaymentStatusPage({ searchParams }: { searchParams: Promise<{ payment?: string | string[] }> }) {
  const session = await requireTenantAccess();
  const { payment } = await searchParams;
  if (Array.isArray(payment)) notFound();
  const where = {
    orgId: session.activeOrgId!,
    method: "MPESA_STK",
    payerTenant: { orgId: session.activeOrgId!, userId: session.userId, deletedAt: null },
  } satisfies Prisma.PaymentWhereInput;
  const attempts = payment
    ? await prisma.payment.findMany({ where: { ...where, id: payment }, select: attemptFields, take: 1 })
    : await prisma.payment.findMany({ where, select: attemptFields, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 25 });
  if (payment && !attempts.length) notFound();

  return (
    <PageShell>
      <div className="space-y-4">
        <header>
          <Link href="/dashboard/tenant/history#payments" className="inline-flex min-h-11 items-center text-sm text-primary underline">Back to payment history</Link>
          <h1 className="text-2xl font-bold">M-Pesa payment status</h1>
          {!payment ? <p className="mt-1 text-sm text-muted-foreground">Your 25 most recent STK attempts.</p> : null}
        </header>
        {!attempts.length ? <SurfaceCard className="p-4">No M-Pesa STK attempts yet.</SurfaceCard> : null}
        {attempts.map(attempt => {
          const status = describeAttempt(attempt);
          const canCheck = !attempt.reversedAt && attempt.verificationStatus === "NOT_REQUIRED"
            && ["PENDING", "INITIATED"].includes(attempt.gatewayStatus) && Boolean(attempt.checkoutRequestId);
          return (
            <SurfaceCard key={attempt.id} className="space-y-2 p-4">
              <h2 className="text-lg font-semibold">{status.title}</h2>
              <p className="text-sm">{formatMoney(attempt.amount)} · {formatDate(attempt.createdAt)}</p>
              {attempt.reference ? <p className="break-all text-sm text-muted-foreground">Reference {attempt.reference}</p> : null}
              <p className="text-sm text-muted-foreground">{status.detail}</p>
              {canCheck ? <StkStatusCheck paymentId={attempt.id} /> : null}
              {attempt.receipt && attempt.gatewayStatus === "SUCCESS" && !attempt.reversedAt && ["VERIFIED", "NOT_REQUIRED"].includes(attempt.verificationStatus) ? (
                <a href={`/dashboard/tenant/receipts/${attempt.receipt.id}`} className="inline-flex min-h-11 items-center text-sm text-primary underline">Download receipt</a>
              ) : null}
            </SurfaceCard>
          );
        })}
        {payment ? <Link href="/dashboard/tenant/payments/status" className="inline-flex min-h-11 items-center text-sm text-primary underline">See recent M-Pesa attempts</Link> : null}
      </div>
    </PageShell>
  );
}
