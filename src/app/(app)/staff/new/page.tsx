import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { createMembership } from "@/features/staff/actions/create-membership";
import { MemberForm } from "@/features/staff/components/member-form";

type AssignmentTarget = {
  id: string;
  type: "BUILDING";
  label: string;
  searchText: string;
};

export default async function NewStaffPage() {
  const orgId = await requireCurrentOrgId();
  const assignmentTargets = await getCaretakerAssignmentTargets(orgId);

  return (
    <div className="grid max-w-6xl gap-5 text-slate-950 dark:text-slate-100 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:p-6">
        <Link
          href="/staff"
          className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
        >
          <span aria-hidden="true" className="mr-2">
            ←
          </span>
          Back to staff directory
        </Link>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-slate-500">
            Staff setup
          </p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-950 dark:text-white">
            Add new staff
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-slate-300">
            Create one staff account and choose the role during setup. If you
            choose caretaker, the form will include apartment/block mapping.
          </p>
        </div>

        <div className="mt-6">
          <MemberForm
            action={createMembership}
            submitLabel="Create staff"
            assignmentTargets={assignmentTargets}
          />
        </div>
      </section>

      <aside className="space-y-3">
        <InfoPanel
          title="Choose the role"
          text="Managers, accountants, office staff, admins, and caretakers are created from this one flow."
        />
        <InfoPanel
          title="Caretaker mapping"
          text="Caretakers must be mapped to an apartment/block. They see houses and water bills under that assignment."
        />
        <InfoPanel
          title="Login credentials"
          text="The staff member gets a verified email login and temporary password during creation."
        />
      </aside>
    </div>
  );
}

async function getCaretakerAssignmentTargets(
  orgId: string,
): Promise<AssignmentTarget[]> {
  const buildings = await prisma.building.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      property: {
        orgId,
        deletedAt: null,
        isActive: true,
      },
    },
    orderBy: [{ property: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      property: {
        select: {
          name: true,
        },
      },
    },
  });

  return buildings.map((building) => ({
    id: building.id,
    type: "BUILDING",
    label: `Apartment: ${building.property.name} - ${building.name}`,
    searchText: `apartment block building ${building.property.name} ${building.name}`,
  }));
}

function InfoPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
      <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
    </div>
  );
}
