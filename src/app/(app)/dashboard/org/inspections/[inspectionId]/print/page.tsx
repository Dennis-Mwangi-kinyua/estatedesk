// src/app/(app)/dashboard/org/inspections/[inspectionId]/print/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import PrintReportButton from "../PrintReportButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    inspectionId: string;
  }>;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(
  value: Prisma.Decimal | number | string | null | undefined
) {
  if (value === null || value === undefined) return "—";

  const amount = Number(value);
  if (Number.isNaN(amount)) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

function readBool(
  report: Record<string, unknown>,
  key: string
): "Yes" | "No" {
  return report[key] === true ? "Yes" : "No";
}

function maskValue(value: string | null | undefined) {
  if (!value || !value.trim()) return "—";
  return "xxx xxxx";
}

function maskPhone(value: string | null | undefined) {
  if (!value || !value.trim()) return "—";

  const trimmed = value.trim();
  if (trimmed.length <= 4) return "xxx xxxx";

  return `${trimmed.slice(0, 2)}xx xxxx`;
}

function maskEmail(value: string | null | undefined) {
  if (!value || !value.trim()) return "—";

  const [local, domain] = value.split("@");
  if (!domain) return "xxx xxxx";

  const visibleLocal = local?.slice(0, 1) || "x";
  return `${visibleLocal}xx xxxx@${domain}`;
}

function maskName(value: string | null | undefined) {
  if (!value || !value.trim()) return "—";

  const parts = value.trim().split(/\s+/);
  if (parts.length === 1) {
    const first = parts[0];
    return `${first.slice(0, 1)}xx xxxx`;
  }

  return parts
    .map((part, index) => {
      if (index === 0) {
        return `${part.slice(0, 1)}xx`;
      }
      return "xxxx";
    })
    .join(" ");
}

function sectionCard(title: string, children: React.ReactNode) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default async function OrgInspectionPrintPage({ params }: PageProps) {
  const session = await requireUserSession();
  const { inspectionId } = await params;

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm">
        No active organisation found for your account.
      </div>
    );
  }

  const [inspection, printedBy, organization] = await Promise.all([
    prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        notice: {
          lease: {
            orgId: session.activeOrgId,
            deletedAt: null,
          },
        },
      },
      include: {
        inspector: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        notice: {
          include: {
            tenant: {
              include: {
                nextOfKin: true,
              },
            },
            lease: {
              include: {
                unit: {
                  include: {
                    property: true,
                    building: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    }),
    prisma.organization.findUnique({
      where: {
        id: session.activeOrgId,
      },
      select: {
        id: true,
        name: true,
        address: true,
        email: true,
        phone: true,
      },
    }),
  ]);

  if (!inspection) {
    notFound();
  }

  const report = (inspection.checklist ?? {}) as Record<string, unknown>;
  const printedAt = new Date();
  const isCompleted = inspection.status === "COMPLETED";

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 print:bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <Link
              href={`/dashboard/org/inspections/${inspection.id}`}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back to inspection
            </Link>

            <PrintReportButton />
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
            <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Move-Out Inspection Report
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {organization?.name ?? "Organisation"}
                  </h1>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>{organization?.address || "Address not provided"}</p>
                    <p>
                      {organization?.email || "—"}
                      {organization?.phone ? ` • ${organization.phone}` : ""}
                    </p>
                  </div>
                </div>

                <div className="min-w-[260px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <p className="text-slate-500">Inspection ID</p>
                      <p className="font-semibold text-slate-950">
                        {inspection.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Notice ID</p>
                      <p className="font-semibold text-slate-950">
                        {inspection.notice.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Status</p>
                      <p className="font-semibold text-slate-950">
                        {inspection.status.replaceAll("_", " ")}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Printed at</p>
                      <p className="font-semibold text-slate-950">
                        {formatDateTime(printedAt)}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-slate-500">Printed by</p>
                      <p className="font-semibold text-slate-950">
                        {printedBy?.fullName ?? "Current user"}
                      </p>
                      <p className="text-slate-600">
                        {maskEmail(printedBy?.email)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6 sm:px-8">
              {sectionCard(
                "Tenant Profile",
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">Full name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {maskName(inspection.notice.tenant.fullName)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Tenant type</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {inspection.notice.tenant.type.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {inspection.notice.tenant.status.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {maskPhone(inspection.notice.tenant.phone)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {maskEmail(inspection.notice.tenant.email)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">National ID</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {maskValue(inspection.notice.tenant.nationalId)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">KRA PIN</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {maskValue(inspection.notice.tenant.kraPin)}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-sm text-slate-500">Company name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {maskValue(inspection.notice.tenant.companyName)}
                    </p>
                  </div>

                  <div className="lg:col-span-3">
                    <p className="text-sm text-slate-500">Tenant notes</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                      {inspection.notice.tenant.notes || "—"}
                    </p>
                  </div>
                </div>
              )}

              {sectionCard(
                "Next of Kin",
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {maskName(inspection.notice.tenant.nextOfKin?.name)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Relationship</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {inspection.notice.tenant.nextOfKin?.relationship || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {maskPhone(inspection.notice.tenant.nextOfKin?.phone)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {maskEmail(inspection.notice.tenant.nextOfKin?.email)}
                    </p>
                  </div>
                </div>
              )}

              {sectionCard(
                "Lease & Unit Details",
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">Property</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {inspection.notice.lease.unit.property.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Building</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {inspection.notice.lease.unit.building?.name || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Apartment / Unit</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {inspection.notice.lease.unit.houseNo}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Bedrooms</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {inspection.notice.lease.unit.bedrooms ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Bathrooms</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {inspection.notice.lease.unit.bathrooms ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Lease status</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {inspection.notice.lease.status.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Lease start</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatDate(inspection.notice.lease.startDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Lease end</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatDate(inspection.notice.lease.endDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Monthly rent</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatMoney(inspection.notice.lease.monthlyRent)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Deposit</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatMoney(inspection.notice.lease.deposit)}
                    </p>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-2">
                    <p className="text-sm text-slate-500">Property address</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {inspection.notice.lease.unit.property.address || "—"}
                    </p>
                  </div>
                </div>
              )}

              {sectionCard(
                "Notice & Inspection Details",
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">Notice date</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatDate(inspection.notice.noticeDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Move-out date</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatDate(inspection.notice.moveOutDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Notice status</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {inspection.notice.status.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Inspection scheduled</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatDateTime(inspection.scheduledAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Inspection completed</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatDateTime(inspection.completedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Inspector</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {maskName(inspection.inspector.fullName)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {maskEmail(inspection.inspector.email)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {maskPhone(inspection.inspector.phone)}
                    </p>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-sm text-slate-500">Notice notes</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                      {inspection.notice.notes || "—"}
                    </p>
                  </div>
                </div>
              )}

              {sectionCard(
                "Submitted Inspection Checklist",
                isCompleted ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-left text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Checklist item</th>
                          <th className="px-4 py-3 font-medium">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Cleanliness", readBool(report, "cleanlinessOk")],
                          ["Walls condition", readBool(report, "wallsOk")],
                          ["Doors & windows", readBool(report, "doorsWindowsOk")],
                          ["Plumbing", readBool(report, "plumbingOk")],
                          ["Electrical", readBool(report, "electricalOk")],
                          ["Keys returned", readBool(report, "keysReturned")],
                          ["Meter readings taken", readBool(report, "meterReadingsTaken")],
                          ["Damage observed", readBool(report, "damageObserved")],
                        ].map(([label, value]) => (
                          <tr key={label} className="border-t border-slate-200">
                            <td className="px-4 py-3 text-slate-800">{label}</td>
                            <td className="px-4 py-3 font-semibold text-slate-950">
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    The caretaker has not submitted the inspection report yet.
                  </div>
                )
              )}

              {sectionCard(
                "Summary",
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {String(report.summary ?? inspection.notes ?? "—")}
                </p>
              )}

              {sectionCard(
                "Recommendations",
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {String(report.recommendations ?? "—")}
                </p>
              )}

              <section className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">Report generated by</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {printedBy?.fullName ?? "Current user"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {maskEmail(printedBy?.email)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Generated at</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatDateTime(printedAt)}
                    </p>
                    <p className="text-sm text-slate-600">
                      Printed / saved from EstateDesk office dashboard
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}