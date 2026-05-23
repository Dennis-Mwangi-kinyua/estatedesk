import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
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

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPercent(value: unknown) {
  return `${toNumber(value).toFixed(2)}%`;
}

function getStatusClasses(status: string | null | undefined) {
  switch (status) {
    case "PAID":
    case "ACTIVE":
    case "SUCCESS":
    case "ACKNOWLEDGED":
      return "border-green-200 bg-green-50 text-green-700";
    case "PAYMENT_PENDING":
    case "READY":
    case "SUBMITTED":
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "FAILED":
    case "REJECTED":
    case "ERROR":
    case "OVERDUE":
      return "border-red-200 bg-red-50 text-red-700";
    case "DRAFT":
    case "MANUAL_REVIEW":
    case "DISABLED":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-muted bg-background text-foreground";
  }
}

export default async function TaxesPage() {
  const hasKraIntegration = "kraIntegration" in prisma;
  const hasTaxpayerProfile = "taxpayerProfile" in prisma;
  const hasRentalIncomeReturn = "rentalIncomeReturn" in prisma;

  const integrations =
    hasKraIntegration && prisma.kraIntegration
      ? await prisma.kraIntegration.findMany({
          orderBy: {
            createdAt: "desc",
          },
          include: {
            org: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        })
      : [];

  const taxpayerProfiles =
    hasTaxpayerProfile && prisma.taxpayerProfile
      ? await prisma.taxpayerProfile.findMany({
          orderBy: {
            createdAt: "desc",
          },
          include: {
            org: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            properties: {
              select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
              },
              orderBy: {
                name: "asc",
              },
            },
          },
        })
      : [];

  const recentReturns =
    hasRentalIncomeReturn && prisma.rentalIncomeReturn
      ? await prisma.rentalIncomeReturn.findMany({
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
          include: {
            org: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            property: {
              select: {
                id: true,
                name: true,
              },
            },
            taxpayerProfile: {
              select: {
                id: true,
                displayName: true,
                kraPin: true,
              },
            },
            items: {
              select: {
                id: true,
                grossRent: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            attempts: {
              orderBy: {
                attemptedAt: "desc",
              },
              take: 1,
              select: {
                id: true,
                channel: true,
                outcome: true,
                errorMessage: true,
                attemptedAt: true,
                httpStatus: true,
              },
            },
            linkedTaxCharges: {
              select: {
                id: true,
                amountDue: true,
                amountPaid: true,
                balance: true,
                status: true,
                dueDate: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            linkedPayments: {
              select: {
                id: true,
                amount: true,
                method: true,
                gatewayStatus: true,
                verificationStatus: true,
                paidAt: true,
                createdAt: true,
                kraReference: true,
                kraReceiptNo: true,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        })
      : [];

  const totalReturns = recentReturns.length;
  const draftReturns = recentReturns.filter((item) => item.status === "DRAFT").length;
  const submittedReturns = recentReturns.filter((item) => item.status === "SUBMITTED").length;
  const acknowledgedReturns = recentReturns.filter((item) => item.status === "ACKNOWLEDGED").length;
  const paidReturns = recentReturns.filter((item) => item.status === "PAID").length;
  const nilReturns = recentReturns.filter((item) => item.isNilReturn).length;
  const paymentPendingReturns = recentReturns.filter(
    (item) => item.status === "PAYMENT_PENDING"
  ).length;

  const totalTaxDue = recentReturns.reduce(
    (sum, item) => sum + toNumber(item.taxDue),
    0
  );

  const totalGrossRent = recentReturns.reduce(
    (sum, item) => sum + toNumber(item.grossRent),
    0
  );

  const activeIntegrations = integrations.filter(
    (item) => item.status === "ACTIVE"
  ).length;

  const activeTaxpayers = taxpayerProfiles.filter((item) => item.isActive).length;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            KRA Rental Income Tax
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage taxpayer profiles, KRA connection status, MRI returns, linked
            tax charges, and remittance activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/org/payments"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            View Payments
          </Link>
          <Link
            href="/dashboard/org/properties"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            View Properties
          </Link>
        </div>
      </div>

      {(!hasKraIntegration || !hasTaxpayerProfile || !hasRentalIncomeReturn) && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="text-base font-semibold text-red-800">
            Prisma client is missing new KRA models
          </h2>
          <p className="mt-1 text-sm text-red-700">
            Run <code>npx prisma generate</code>, stop the dev server, then start it again.
          </p>
        </section>
      )}

      {(taxpayerProfiles.length === 0 || integrations.length === 0) && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-base font-semibold text-amber-800">
            KRA setup still needs data
          </h2>
          <p className="mt-1 text-sm text-amber-700">
            This page is ready, but you still need at least one{" "}
            <span className="font-medium">TaxpayerProfile</span> and one{" "}
            <span className="font-medium">KraIntegration</span> row to start
            generating proper rental returns.
          </p>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total MRI Returns</p>
          <p className="mt-2 text-2xl font-semibold">{totalReturns}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Draft Returns</p>
          <p className="mt-2 text-2xl font-semibold">{draftReturns}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Submitted</p>
          <p className="mt-2 text-2xl font-semibold">{submittedReturns}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Acknowledged</p>
          <p className="mt-2 text-2xl font-semibold">{acknowledgedReturns}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Payment Pending</p>
          <p className="mt-2 text-2xl font-semibold">{paymentPendingReturns}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Paid Returns</p>
          <p className="mt-2 text-2xl font-semibold">{paidReturns}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Gross Rent Filed</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(totalGrossRent)}
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Tax Due</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(totalTaxDue)}
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Nil Returns</p>
          <p className="mt-2 text-2xl font-semibold">{nilReturns}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active Taxpayers</p>
          <p className="mt-2 text-2xl font-semibold">{activeTaxpayers}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">KRA Integration Status</h2>
          </div>

          <div className="space-y-4 p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Connected Orgs</p>
                <p className="mt-2 text-2xl font-semibold">{activeIntegrations}</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Total Setups</p>
                <p className="mt-2 text-2xl font-semibold">{integrations.length}</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Taxpayer Profiles</p>
                <p className="mt-2 text-2xl font-semibold">{taxpayerProfiles.length}</p>
              </div>
            </div>

            {integrations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No KRA integration rows found yet.
              </div>
            ) : (
              <div className="space-y-3">
                {integrations.slice(0, 5).map((integration) => (
                  <div key={integration.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{integration.org.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {integration.filingMode} · {integration.environment}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                          integration.status
                        )}`}
                      >
                        {integration.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>API Base URL: {integration.apiBaseUrl ?? "—"}</p>
                      <p>eRITS URL: {integration.eritsBaseUrl ?? "—"}</p>
                      <p>Last Sync: {formatDateTime(integration.lastSyncAt)}</p>
                      <p>Last Error: {integration.lastError ?? "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Taxpayer Profiles</h2>
          </div>

          {taxpayerProfiles.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No taxpayer profiles found.
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {taxpayerProfiles.slice(0, 6).map((profile) => (
                <div key={profile.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{profile.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.kraPin} · {profile.kind} · {profile.org.name}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                          profile.isActive ? "ACTIVE" : "DISABLED"
                        )}`}
                      >
                        {profile.isActive ? "ACTIVE" : "DISABLED"}
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                          profile.isResident ? "ACKNOWLEDGED" : "MANUAL_REVIEW"
                        )}`}
                      >
                        {profile.isResident ? "RESIDENT" : "NON-RESIDENT"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>Email: {profile.email ?? "—"}</p>
                    <p>Phone: {profile.phone ?? "—"}</p>
                    <p>Properties Linked: {profile.properties.length}</p>
                    <p>
                      Residential Properties:{" "}
                      {
                        profile.properties.filter(
                          (property) => property.type === "RESIDENTIAL"
                        ).length
                      }
                    </p>
                  </div>

                  {profile.properties.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profile.properties.slice(0, 5).map((property) => (
                        <span
                          key={property.id}
                          className="inline-flex rounded-full border px-2.5 py-1 text-xs"
                        >
                          {property.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Recent KRA Rental Returns</h2>
        </div>

        {recentReturns.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No rental income returns found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Taxpayer</th>
                  <th className="px-4 py-3 font-medium">PIN</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Gross Rent</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                  <th className="px-4 py-3 font-medium">Tax Due</th>
                  <th className="px-4 py-3 font-medium">KRA Status</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">KRA Refs</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentReturns.map((rentalReturn) => {
                  const latestAttempt = rentalReturn.attempts[0] ?? null;
                  const latestPayment = rentalReturn.linkedPayments[0] ?? null;
                  const linkedTaxCharge = rentalReturn.linkedTaxCharges[0] ?? null;

                  return (
                    <tr key={rentalReturn.id} className="border-t align-top">
                      <td className="px-4 py-3 font-medium">
                        <div>{rentalReturn.period}</div>
                        {rentalReturn.isNilReturn && (
                          <span className="mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs">
                            NIL RETURN
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {rentalReturn.taxpayerProfile?.displayName ??
                            rentalReturn.taxpayerName ??
                            "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {rentalReturn.org.name}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {rentalReturn.taxpayerProfile?.kraPin ?? rentalReturn.taxpayerPin}
                      </td>

                      <td className="px-4 py-3">
                        {rentalReturn.property ? (
                          <Link
                            href="/dashboard/org/properties"
                            className="underline underline-offset-4"
                          >
                            {rentalReturn.property.name}
                          </Link>
                        ) : (
                          <div>
                            <div>All linked properties</div>
                            <div className="text-xs text-muted-foreground">
                              {rentalReturn.items.length} item(s)
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {formatCurrency(rentalReturn.grossRent)}
                      </td>

                      <td className="px-4 py-3">
                        {formatPercent(rentalReturn.taxRate)}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(rentalReturn.taxDue)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                            rentalReturn.status
                          )}`}
                        >
                          {rentalReturn.status}
                        </span>

                        {latestAttempt && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Last attempt: {latestAttempt.outcome} ·{" "}
                            {formatDateTime(latestAttempt.attemptedAt)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div>{rentalReturn.filingChannel}</div>
                        <div className="text-xs text-muted-foreground">
                          {rentalReturn.regime} · {rentalReturn.basis}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {latestPayment ? (
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatCurrency(latestPayment.amount)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {latestPayment.method} · {latestPayment.gatewayStatus}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Verified: {latestPayment.verificationStatus}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Paid: {formatDateTime(latestPayment.paidAt)}
                            </div>
                          </div>
                        ) : linkedTaxCharge ? (
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatCurrency(linkedTaxCharge.amountDue)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Paid: {formatCurrency(linkedTaxCharge.amountPaid)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Balance: {formatCurrency(linkedTaxCharge.balance)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Due: {formatDate(linkedTaxCharge.dueDate)}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-1 text-xs">
                          <div>Return Ref: {rentalReturn.kraReturnRef ?? "—"}</div>
                          <div>Assessment: {rentalReturn.assessmentRef ?? "—"}</div>
                          <div>Payment Ref: {rentalReturn.kraPaymentRef ?? "—"}</div>
                          <div>Receipt No: {rentalReturn.kraReceiptNo ?? "—"}</div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div>{formatDateTime(rentalReturn.updatedAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          Submitted: {formatDateTime(rentalReturn.submittedAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Paid: {formatDateTime(rentalReturn.paidAt)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}