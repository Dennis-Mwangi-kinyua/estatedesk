import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  isTransientDatabaseError,
  retryTransientDatabaseOperation,
} from "@/lib/db/retry";
import {
  AdminLink,
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatCurrency,
  formatDateTime,
  labelize,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

function paymentOpsQuery<T>(label: string, operation: () => Promise<T>) {
  return retryTransientDatabaseOperation(operation, {
    attempts: 4,
    delayMs: 650,
    label,
  });
}

type AttentionPayment = {
  id: string;
  amount: { toString(): string } | number;
  targetType: string;
  gatewayStatus: string;
  verificationStatus: string;
  reference: string | null;
  externalReference: string | null;
  checkoutRequestId: string | null;
  payerName: string | null;
  payerType: string;
  createdAt: Date;
  org: { id: string; name: string; slug: string };
  payerTenant: { fullName: string } | null;
};

function paymentReference(payment: AttentionPayment) {
  return (
    payment.reference ??
    payment.externalReference ??
    payment.checkoutRequestId ??
    "—"
  );
}

function paymentPayer(payment: AttentionPayment) {
  return (
    payment.payerTenant?.fullName ??
    payment.payerName ??
    labelize(payment.payerType)
  );
}

function AttentionPaymentCard({ payment }: { payment: AttentionPayment }) {
  return (
    <article className="min-w-0 border-b border-border last:border-b-0">
      <div className="space-y-3 px-3 py-3.5 sm:px-4 sm:py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <AdminLink href={`/platform/organizations/${payment.org.slug}`}>
              <span className="block truncate text-sm font-semibold">
                {payment.org.name}
              </span>
            </AdminLink>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              /{payment.org.slug}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency(Number(payment.amount))}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone={toneForStatus(payment.gatewayStatus)}>
            Gateway · {payment.gatewayStatus}
          </Badge>
          <Badge tone={toneForStatus(payment.verificationStatus)}>
            Verify · {payment.verificationStatus}
          </Badge>
        </div>

        <dl className="grid grid-cols-1 gap-1.5 rounded-xl border border-border bg-muted/30 p-2.5 text-[11px] sm:grid-cols-2 sm:text-xs">
          <div className="min-w-0">
            <dt className="font-medium text-muted-foreground">Payer</dt>
            <dd className="mt-0.5 truncate font-semibold text-foreground">
              {paymentPayer(payment)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-medium text-muted-foreground">Target</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {labelize(payment.targetType)}
            </dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="font-medium text-muted-foreground">Reference</dt>
            <dd className="mt-0.5 break-all font-semibold text-foreground">
              {paymentReference(payment)}
            </dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="font-medium text-muted-foreground">Created</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {formatDateTime(payment.createdAt)}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default async function PaymentOpsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  let pending: number;
  let failed: number;
  let rejected: number;
  let missingReceipt: number;
  let payments: AttentionPayment[];

  try {
    const loaded = await paymentOpsQuery("platform-payment-ops", async () => {
      const [pendingCount, failedCount, rejectedCount, missingCount, rows] =
        await Promise.all([
          prisma.payment.count({ where: { verificationStatus: "PENDING" } }),
          prisma.payment.count({ where: { gatewayStatus: "FAILED" } }),
          prisma.payment.count({ where: { verificationStatus: "REJECTED" } }),
          prisma.payment.count({
            where: { verificationStatus: "VERIFIED", receipt: null },
          }),
          prisma.payment.findMany({
            where: {
              OR: [
                { verificationStatus: "PENDING" },
                { verificationStatus: "REJECTED" },
                { gatewayStatus: "FAILED" },
                { gatewayStatus: "PENDING" },
                { gatewayStatus: "INITIATED" },
              ],
            },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
              org: { select: { id: true, name: true, slug: true } },
              payerTenant: { select: { fullName: true } },
            },
          }),
        ]);

      return {
        pending: pendingCount,
        failed: failedCount,
        rejected: rejectedCount,
        missingReceipt: missingCount,
        payments: rows as AttentionPayment[],
      };
    });

    pending = loaded.pending;
    failed = loaded.failed;
    rejected = loaded.rejected;
    missingReceipt = loaded.missingReceipt;
    payments = loaded.payments;
  } catch (error) {
    console.error("[PaymentOpsPage] load failed", error);
    return (
      <div className="ed-mobile-first space-y-4 sm:space-y-5">
        <PageHeader
          eyebrow="Payment operations"
          title="Callbacks and reconciliation"
          description="Payments requiring platform attention: pending verification, rejected records, failed gateways, and verified payments missing receipts."
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
          <p className="font-semibold">Could not load the attention queue</p>
          <p className="mt-1">
            {isTransientDatabaseError(error)
              ? "The database request timed out temporarily. Refresh the page in a moment."
              : "The database request failed. Refresh the page and check connectivity if it persists."}
          </p>
        </div>
      </div>
    );
  }

  const totalValue = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  return (
    <div className="ed-mobile-first space-y-4 sm:space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Payment operations"
        title="Callbacks and reconciliation"
        description="Payments requiring platform attention: pending verification, rejected records, failed gateways, and verified payments missing receipts."
      />

      <section className="ed-keep-cols grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <StatCard label="Pending verification" value={pending} />
        <StatCard label="Gateway failed" value={failed} />
        <StatCard label="Rejected" value={rejected} />
        <StatCard
          label="Missing receipts"
          value={missingReceipt}
          note={formatCurrency(totalValue)}
        />
      </section>

      <Surface
        title="Attention queue"
        description={`${payments.length} payment${payments.length === 1 ? "" : "s"} needing review`}
      >
        {payments.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No payment operations need attention.
          </div>
        ) : (
          <>
            {/* Mobile-first cards — no horizontal table on phones */}
            <ul className="ed-org-control-list lg:hidden">
              {payments.map((payment) => (
                <li key={payment.id}>
                  <AttentionPaymentCard payment={payment} />
                </li>
              ))}
            </ul>

            {/* Desktop comparison table */}
            <div className="ed-org-control-table hidden lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Organization</th>
                      <th className="px-4 py-3 font-medium">Payer</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Target</th>
                      <th className="px-4 py-3 font-medium">Gateway</th>
                      <th className="px-4 py-3 font-medium">Verification</th>
                      <th className="px-4 py-3 font-medium">Reference</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-t border-border align-top"
                      >
                        <td className="px-4 py-3">
                          <AdminLink
                            href={`/platform/organizations/${payment.org.slug}`}
                          >
                            {payment.org.name}
                          </AdminLink>
                          <p className="mt-1 text-xs text-muted-foreground">
                            /{payment.org.slug}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {paymentPayer(payment)}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums text-foreground">
                          {formatCurrency(Number(payment.amount))}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {labelize(payment.targetType)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={toneForStatus(payment.gatewayStatus)}>
                            {payment.gatewayStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={toneForStatus(payment.verificationStatus)}
                          >
                            {payment.verificationStatus}
                          </Badge>
                        </td>
                        <td className="max-w-[14rem] break-all px-4 py-3 text-muted-foreground">
                          {paymentReference(payment)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatDateTime(payment.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 ? (
                      <EmptyRow
                        colSpan={8}
                        label="No payment operations need attention."
                      />
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Surface>
    </div>
  );
}
