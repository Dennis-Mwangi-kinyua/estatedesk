import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { CreateCaretakerForm } from "@/features/staff/components/create-caretaker-form";

export const dynamic = "force-dynamic";

export default async function NewCaretakerPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm">
        No active organisation found for your account.
      </div>
    );
  }

  const orgId = session.activeOrgId;

  const [properties, buildings, units] = await Promise.all([
    prisma.property.findMany({
      where: {
        orgId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        location: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.building.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        property: {
          orgId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        name: true,
        propertyId: true,
        property: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ property: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.unit.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        property: {
          orgId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        houseNo: true,
        propertyId: true,
        buildingId: true,
        property: {
          select: {
            name: true,
          },
        },
        building: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ property: { name: "asc" } }, { houseNo: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-4 p-5 sm:p-6">
          <Link
            href="/staff/caretaker"
            className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <span aria-hidden="true" className="mr-2">
              ←
            </span>
            Back to caretaker directory
          </Link>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">
              Caretaker setup
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Create Caretaker
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Add full caretaker details, create staff access, and map the
              caretaker to a property, building, or apartment in one flow.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Step 1</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                Full caretaker details
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Step 2</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                Staff account access
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Step 3</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                Property or apartment mapping
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
                Caretaker details and assignment
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Capture the caretaker profile and map them to the right
                property, building, or unit.
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <CreateCaretakerForm
                properties={properties}
                buildings={buildings}
                units={units}
              />
            </div>
          </div>
        </div>

        <div className="space-y-5 xl:col-span-1">
          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
                What to capture
              </h2>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-900">
                  Personal details
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Full name, username, password, email address, and phone
                  number.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-900">
                  Assignment scope
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Map the caretaker to a property, building, or apartment
                  depending on what they manage.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-900">
                  No sample identity
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  This page uses neutral placeholders only and does not show
                  example names like John Doe.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-sky-200 bg-sky-50 shadow-sm">
            <div className="border-b border-sky-100 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-sky-950 sm:text-lg">
                Available mapping records
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 sm:p-6">
              <div className="rounded-2xl border border-sky-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-500">Properties</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {properties.length.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-500">Buildings</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {buildings.length.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-500">Units</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {units.length.toLocaleString()}
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}