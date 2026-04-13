import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { Prisma, TicketPriority } from "@prisma/client";
import { AlertCircle, ChevronLeft, Send, Wrench } from "lucide-react";

const tenantIssueReportArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        deletedAt: null,
        status: "ACTIVE",
      },
      orderBy: {
        startDate: "desc",
      },
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
});

type TenantIssueReportResult = Prisma.TenantGetPayload<
  typeof tenantIssueReportArgs
>;

type PageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "missing_fields":
      return "Please fill in the title, unit, and description.";
    case "invalid_unit":
      return "The selected unit is not available for your tenant account.";
    case "tenant_not_found":
      return "We could not verify your tenant profile.";
    default:
      return null;
  }
}

function unitLabel(unit: {
  id: string;
  houseNo: string;
  property: { name: string };
  building: { name: string } | null;
}) {
  return `${unit.property.name} • Unit ${unit.houseNo}${
    unit.building?.name ? ` • ${unit.building.name}` : ""
  }`;
}

export default async function TenantReportIssuePage({
  searchParams,
}: PageProps) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const tenant: TenantIssueReportResult | null = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    ...tenantIssueReportArgs,
  });

  if (!tenant) {
    redirect("/dashboard/tenant/issues?error=tenant_not_found");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const errorMessage = getErrorMessage(resolvedSearchParams.error);

  const leaseUnits = tenant.leases
    .map((lease) => lease.unit)
    .filter((unit, index, arr) => arr.findIndex((u) => u.id === unit.id) === index);

  async function reportIssueAction(formData: FormData) {
    "use server";

    const session = await requireTenantAccess();

    if (!session.userId) {
      throw new Error("Missing user id in session");
    }

    if (!session.activeOrgId) {
      throw new Error("Missing active organization id in session");
    }

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const unitId = String(formData.get("unitId") ?? "").trim();
    const priorityInput = String(formData.get("priority") ?? "MEDIUM").trim();

    const allowedPriorities: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    const priority: TicketPriority = allowedPriorities.includes(
      priorityInput as TicketPriority
    )
      ? (priorityInput as TicketPriority)
      : "MEDIUM";

    if (!title || !description || !unitId) {
      redirect("/dashboard/tenant/issues/report?error=missing_fields");
    }

    const tenant = await prisma.tenant.findFirst({
      where: {
        userId: session.userId,
        orgId: session.activeOrgId,
        deletedAt: null,
      },
      include: {
        leases: {
          where: {
            deletedAt: null,
          },
          include: {
            unit: true,
          },
        },
      },
    });

    if (!tenant) {
      redirect("/dashboard/tenant/issues/report?error=tenant_not_found");
    }

    const allowedUnit = tenant.leases.find((lease) => lease.unitId === unitId)?.unit;

    if (!allowedUnit) {
      redirect("/dashboard/tenant/issues/report?error=invalid_unit");
    }

    await prisma.issueTicket.create({
      data: {
        orgId: session.activeOrgId,
        propertyId: allowedUnit.propertyId,
        unitId: allowedUnit.id,
        reportedByUserId: session.userId,
        title,
        description,
        priority,
        status: "OPEN",
      },
    });

    revalidatePath("/dashboard/tenant/issues");
    redirect("/dashboard/tenant/issues");
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        <div className="space-y-4 sm:space-y-6">
          <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <Link
                  href="/dashboard/tenant/issues"
                  className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-800"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back to issues
                </Link>

                <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                  Tenant Support
                </p>
                <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
                  Report Issue
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                  Submit a maintenance or support issue for your current unit so
                  management can review and track it.
                </p>
              </div>

              <div className="rounded-[24px] bg-[#f7f7fa] px-4 py-4 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Available Units
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-950">
                  {leaseUnits.length}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  Select the affected unit below
                </p>
              </div>
            </div>
          </section>

          {errorMessage ? (
            <section className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            </section>
          ) : null}

          <form action={reportIssueAction} className="space-y-4 sm:space-y-6">
            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
              <div className="mb-4">
                <h2 className="text-[20px] font-semibold tracking-tight text-neutral-950">
                  Issue Details
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Give a clear summary and description so the team can help faster.
                </p>
              </div>

              <div className="grid gap-4">
                <div>
                  <label
                    htmlFor="unitId"
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    Unit
                  </label>
                  <select
                    id="unitId"
                    name="unitId"
                    required
                    defaultValue={leaseUnits[0]?.id ?? ""}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                  >
                    {leaseUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unitLabel(unit)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    Issue title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    maxLength={120}
                    placeholder="e.g. Bathroom sink leaking"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue="MEDIUM"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={6}
                    maxLength={2000}
                    placeholder="Describe the problem, where it is, when it started, and anything that makes it worse or urgent."
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f2f7]">
                  <Wrench className="h-4 w-4 text-neutral-700" />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold tracking-tight text-neutral-950">
                    Before you submit
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Include the exact room or area affected, what is happening,
                    and how urgent it is. This helps management assign the issue
                    correctly.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/tenant/issues"
                  className="inline-flex items-center justify-center rounded-[16px] border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Issue
                </button>
              </div>
            </section>
          </form>
        </div>
      </div>
    </div>
  );
}