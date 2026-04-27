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

type AssignmentTargetType = "PROPERTY" | "BUILDING" | "UNIT";

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

  return (
    <div className="max-w-2xl rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Create Staff Member
          </p>

          <h1 className="mt-2 text-2xl font-bold text-neutral-950">
            Add {roleMeta.label}
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {roleMeta.description}
          </p>
        </div>

        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700">
          Role: {normalizedRole}
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <h2 className="text-sm font-semibold text-emerald-900">
          Verified staff login
        </h2>
        <p className="mt-1 text-sm leading-6 text-emerald-800">
          This staff member will be created with a verified username, email,
          secure password, and the locked staff role shown above.
        </p>
      </div>

      {normalizedRole === "CARETAKER" ? (
        <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <h2 className="text-sm font-semibold text-sky-900">
            Caretaker mapping
          </h2>
          <p className="mt-1 text-sm leading-6 text-sky-800">
            Search and map this caretaker to a whole property, a building, or a
            specific apartment/unit during creation.
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <MemberForm
          action={createMembership}
          submitLabel={`Create ${roleMeta.label}`}
          lockedRole={normalizedRole}
          assignmentTargets={assignmentTargets}
        />
      </div>
    </div>
  );
}

async function getCaretakerAssignmentTargets(
  orgId: string,
): Promise<AssignmentTarget[]> {
  const [properties, buildings, units] = await Promise.all([
    prisma.property.findMany({
      where: {
        orgId,
        deletedAt: null,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),

    prisma.building.findMany({
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
    }),

    prisma.unit.findMany({
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
        houseNo: "asc",
      },
      select: {
        id: true,
        houseNo: true,
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
    }),
  ]);

  const propertyTargets: AssignmentTarget[] = properties.map((property) => ({
    id: property.id,
    type: "PROPERTY",
    label: `Property: ${property.name}`,
    searchText: `property ${property.name}`,
  }));

  const buildingTargets: AssignmentTarget[] = buildings.map((building) => ({
    id: building.id,
    type: "BUILDING",
    label: `Building: ${building.property.name} - ${building.name}`,
    searchText: `building ${building.property.name} ${building.name}`,
  }));

  const unitTargets: AssignmentTarget[] = units.map((unit) => {
    const labelParts = [
      unit.property.name,
      unit.building?.name,
      `Unit ${unit.houseNo}`,
    ].filter(Boolean);

    const label = `Apartment: ${labelParts.join(" - ")}`;

    return {
      id: unit.id,
      type: "UNIT",
      label,
      searchText: `apartment unit house ${labelParts.join(" ")}`,
    };
  });

  return [...unitTargets, ...buildingTargets, ...propertyTargets];
}