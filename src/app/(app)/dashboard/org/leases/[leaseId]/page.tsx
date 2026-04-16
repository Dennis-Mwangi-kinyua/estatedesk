import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type LeasePageProps = {
  params: Promise<{
    leaseId: string;
  }> | {
    leaseId: string;
  };
};

function toNumber(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

function formatCurrency(value: unknown, currencyCode = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function getLeaseStatusClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "EXPIRED":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "TERMINATED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getChargeStatusClass(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PARTIAL":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "OVERDUE":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "UNPAID":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default async function LeaseDetailPage({ params }: LeasePageProps) {
  const { leaseId } = await params;

  const lease = await prisma.lease.findUnique({
    where: {
      id: leaseId,
    },
    include: {
      org: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          currencyCode: true,
          address: true,
        },
      },
      tenant: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          nationalId: true,
          companyName: true,
          status: true,
        },
      },
      caretaker: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
      contractDocument: {
        select: {
          id: true,
          fileName: true,
          fileType: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
      },
      unit: {
        select: {
          id: true,
          houseNo: true,
          type: true,
          bedrooms: true,
          bathrooms: true,
          rentAmount: true,
          depositAmount: true,
          status: true,
          notes: true,
          property: {
            select: {
              id: true,
              name: true,
              type: true,
              location: true,
              address: true,
            },
          },
          building: {
            select: {
              id: true,
              name: true,
              notes: true,
            },
          },
        },
      },
      rentCharges: {
        orderBy: {
          dueDate: "desc",
        },
        select: {
          id: true,
          period: true,
          amountDue: true,
          amountPaid: true,
          balance: true,
          dueDate: true,
          status: true,
          chargeType: true,
          description: true,
        },
      },
      taxCharges: {
        orderBy: {
          dueDate: "desc",
        },
        select: {
          id: true,
          period: true,
          taxType: true,
          amountDue: true,
          amountPaid: true,
          balance: true,
          dueDate: true,
          status: true,
          taxAuthority: true,
          kraPaymentRef: true,
          kraReceiptNo: true,
        },
      },
      moveOutNotices: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          noticeDate: true,
          moveOutDate: true,
          status: true,
          notes: true,
          inspection: {
            select: {
              id: true,
              scheduledAt: true,
              status: true,
              completedAt: true,
              inspector: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      },
      tenantActionLogs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          action: true,
          reason: true,
          notes: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!lease) {
    notFound();
  }

  const currencyCode = lease.org.currencyCode ?? "KES";

  const totalRentCharges = lease.rentCharges.reduce(
    (sum, charge) => sum + toNumber(charge.amountDue),
    0
  );

  const totalRentPaid = lease.rentCharges.reduce(
    (sum, charge) => sum + toNumber(charge.amountPaid),
    0
  );

  const totalRentBalance = lease.rentCharges.reduce(
    (sum, charge) => sum + toNumber(charge.balance),
    0
  );

  const totalTaxCharges = lease.taxCharges.reduce(
    (sum, charge) => sum + toNumber(charge.amountDue),
    0
  );

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/org/leases" className="underline underline-offset-4">
              Leases
            </Link>
            <span>/</span>
            <span>{lease.id}</span>
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Lease Details
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Review lease information, linked tenant and unit details, charges,
            notices, and recent activity.
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-medium ${getLeaseStatusClass(
            lease.status
          )}`}
        >
          {lease.status}
        </span>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Monthly Rent</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(lease.monthlyRent, currencyCode)}
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Deposit</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(lease.deposit, currencyCode)}
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Due Day</p>
          <p className="mt-2 text-2xl font-semibold">{lease.dueDay}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Contract</p>
          <p className="mt-2 text-2xl font-semibold">
            {lease.contractDocument ? "Uploaded" : "Missing"}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border bg-background p-5 shadow-sm xl:col-span-1">
          <h2 className="text-base font-semibold">Lease Overview</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Lease ID</dt>
              <dd className="font-medium">{lease.id}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Organization</dt>
              <dd className="text-right font-medium">{lease.org.name}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Start Date</dt>
              <dd className="font-medium">{formatDate(lease.startDate)}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">End Date</dt>
              <dd className="font-medium">{formatDate(lease.endDate)}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDate(lease.createdAt)}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Updated</dt>
              <dd className="font-medium">{formatDate(lease.updatedAt)}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="max-w-[60%] text-right font-medium">
                {lease.notes ?? "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm xl:col-span-1">
          <h2 className="text-base font-semibold">Tenant</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-right font-medium">
                <Link
                  href={`/tenants/${lease.tenant.id}`}
                  className="underline underline-offset-4"
                >
                  {lease.tenant.fullName}
                </Link>
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{lease.tenant.phone}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="max-w-[60%] text-right font-medium">
                {lease.tenant.email ?? "—"}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">National ID</dt>
              <dd className="font-medium">{lease.tenant.nationalId ?? "—"}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Company</dt>
              <dd className="font-medium">{lease.tenant.companyName ?? "—"}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{lease.tenant.status}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm xl:col-span-1">
          <h2 className="text-base font-semibold">Unit & Property</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Unit</dt>
              <dd className="text-right font-medium">
                <Link
                  href={`/units/${lease.unit.id}`}
                  className="underline underline-offset-4"
                >
                  {lease.unit.houseNo}
                </Link>
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Unit Type</dt>
              <dd className="font-medium">{lease.unit.type}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Property</dt>
              <dd className="max-w-[60%] text-right font-medium">
                <Link
                  href={`/properties/${lease.unit.property.id}`}
                  className="underline underline-offset-4"
                >
                  {lease.unit.property.name}
                </Link>
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Building</dt>
              <dd className="font-medium">{lease.unit.building?.name ?? "—"}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Bedrooms</dt>
              <dd className="font-medium">{lease.unit.bedrooms ?? "—"}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Bathrooms</dt>
              <dd className="font-medium">{lease.unit.bathrooms ?? "—"}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Unit Status</dt>
              <dd className="font-medium">{lease.unit.status}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <h2 className="text-base font-semibold">Caretaker</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Assigned</dt>
              <dd className="font-medium">
                {lease.caretaker ? lease.caretaker.fullName : "—"}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{lease.caretaker?.phone ?? "—"}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="max-w-[60%] text-right font-medium">
                {lease.caretaker?.email ?? "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <h2 className="text-base font-semibold">Contract Document</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">File</dt>
              <dd className="max-w-[60%] text-right font-medium">
                {lease.contractDocument?.fileName ?? "—"}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">
                {lease.contractDocument?.mimeType ?? "—"}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Uploaded</dt>
              <dd className="font-medium">
                {formatDate(lease.contractDocument?.createdAt)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <h2 className="text-base font-semibold">Financial Snapshot</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Rent Charges</dt>
              <dd className="font-medium">{lease.rentCharges.length}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Total Rent Due</dt>
              <dd className="font-medium">
                {formatCurrency(totalRentCharges, currencyCode)}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Total Rent Paid</dt>
              <dd className="font-medium">
                {formatCurrency(totalRentPaid, currencyCode)}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Rent Balance</dt>
              <dd className="font-medium">
                {formatCurrency(totalRentBalance, currencyCode)}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Tax Charges</dt>
              <dd className="font-medium">{lease.taxCharges.length}</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Total Tax Due</dt>
              <dd className="font-medium">
                {formatCurrency(totalTaxCharges, currencyCode)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Rent Charges</h2>
        </div>

        {lease.rentCharges.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No rent charges found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Charge</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Amount Due</th>
                  <th className="px-4 py-3 font-medium">Amount Paid</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {lease.rentCharges.map((charge) => (
                  <tr key={charge.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{charge.id}</td>
                    <td className="px-4 py-3">{charge.period}</td>
                    <td className="px-4 py-3">{charge.chargeType}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(charge.amountDue, currencyCode)}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(charge.amountPaid, currencyCode)}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(charge.balance, currencyCode)}
                    </td>
                    <td className="px-4 py-3">{formatDate(charge.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getChargeStatusClass(
                          charge.status
                        )}`}
                      >
                        {charge.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Tax Charges</h2>
        </div>

        {lease.taxCharges.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No tax charges found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Charge</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Tax Type</th>
                  <th className="px-4 py-3 font-medium">Authority</th>
                  <th className="px-4 py-3 font-medium">Amount Due</th>
                  <th className="px-4 py-3 font-medium">Amount Paid</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {lease.taxCharges.map((charge) => (
                  <tr key={charge.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{charge.id}</td>
                    <td className="px-4 py-3">{charge.period}</td>
                    <td className="px-4 py-3">{charge.taxType}</td>
                    <td className="px-4 py-3">{charge.taxAuthority}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(charge.amountDue, currencyCode)}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(charge.amountPaid, currencyCode)}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(charge.balance, currencyCode)}
                    </td>
                    <td className="px-4 py-3">{formatDate(charge.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getChargeStatusClass(
                          charge.status
                        )}`}
                      >
                        {charge.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Move-Out Notices</h2>
          </div>

          {lease.moveOutNotices.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No move-out notices found.
            </div>
          ) : (
            <div className="divide-y">
              {lease.moveOutNotices.map((notice) => (
                <div key={notice.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{notice.id}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Notice: {formatDate(notice.noticeDate)} • Move-out:{" "}
                        {formatDate(notice.moveOutDate)}
                      </p>
                    </div>

                    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                      {notice.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    {notice.notes ?? "No additional notes."}
                  </p>

                  {notice.inspection ? (
                    <div className="mt-3 rounded-lg border bg-muted/20 p-3 text-sm">
                      <p className="font-medium">Inspection</p>
                      <p className="mt-1 text-muted-foreground">
                        Scheduled: {formatDate(notice.inspection.scheduledAt)}
                      </p>
                      <p className="text-muted-foreground">
                        Status: {notice.inspection.status}
                      </p>
                      <p className="text-muted-foreground">
                        Inspector: {notice.inspection.inspector.fullName}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Recent Tenant Action Logs</h2>
          </div>

          {lease.tenantActionLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No recent tenant action logs found.
            </div>
          ) : (
            <div className="divide-y">
              {lease.tenantActionLogs.map((log) => (
                <div key={log.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        By {log.actor.fullName} on {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    {log.reason ?? log.notes ?? "No extra details."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}