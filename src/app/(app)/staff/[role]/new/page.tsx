import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { createMembership } from "@/features/staff/actions/create-membership";
import { MemberForm } from "@/features/staff/components/member-form";
import {
  ROLE_META,
  normalizeStaffRole,
} from "@/features/staff/constants/role-meta";

type Props = {
  params: Promise<{ role: string }>;
};

type AssignmentTargetType = "BUILDING";

type AssignmentTarget = {
  id: string;
  type: AssignmentTargetType;
  label: string;
  searchText: string;
};

export default async function NewRoleMemberPage({ params }: Props) {
  const { role } = await params;
  const normalizedRole = normalizeStaffRole(role);

  if (!normalizedRole) {
    notFound();
  }

  const orgId = await requireCurrentOrgId();
  const roleMeta = ROLE_META[normalizedRole];

  const assignmentTargets =
    normalizedRole === "CARETAKER"
      ? await getCaretakerAssignmentTargets(orgId)
      : undefined;
  const isCaretaker = normalizedRole === "CARETAKER";

  return (
    <div className="grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Staff setup
            </p>

            <h1 className="mt-2 text-2xl font-bold text-neutral-950">
              Add {roleMeta.label}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              {isCaretaker
                ? "Create the caretaker login, then map the caretaker to one apartment/block. The houses under that apartment become their working scope."
                : `Create a verified ${roleMeta.label.toLowerCase()} account with the correct organization role and login credentials.`}
            </p>
          </div>

          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700">
            Role: {normalizedRole}
          </span>
        </div>

        <div className="mt-6">
          <MemberForm
            action={createMembership}
            submitLabel={`Create ${roleMeta.label}`}
            lockedRole={normalizedRole}
            assignmentTargets={assignmentTargets}
          />
        </div>
      </section>

      <aside className="space-y-3">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="text-sm font-semibold text-emerald-900">
            Verified staff login
          </h2>
          <p className="mt-1 text-sm leading-6 text-emerald-800">
            The account is created with a username, verified email, temporary
            password, and the locked role shown here.
          </p>
        </div>

        {isCaretaker ? (
          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4">
            <h2 className="text-sm font-semibold text-sky-900">
              Apartment-only mapping
            </h2>
            <p className="mt-1 text-sm leading-6 text-sky-800">
              Select an apartment/block only. Individual houses are visible to
              the caretaker through that apartment assignment.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Streamlined setup
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Enter identity details, set login credentials, and save. No
              property mapping is needed for this role.
            </p>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Setup order
          </p>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            <p>1. Confirm identity and contacts.</p>
            <p>2. Create login credentials.</p>
            <p>
              3. {isCaretaker ? "Assign the apartment/block." : "Save the role."}
            </p>
          </div>
        </div>
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
      orderBy: {
        name: "asc",
      },
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

  const buildingTargets: AssignmentTarget[] = buildings.map((building) => ({
    id: building.id,
    type: "BUILDING",
    label: `Apartment: ${building.property.name} - ${building.name}`,
    searchText: `apartment block building ${building.property.name} ${building.name}`,
  }));

  return buildingTargets;
}
