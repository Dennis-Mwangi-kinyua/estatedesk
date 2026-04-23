import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { updateMembership } from "@/features/staff/actions/update-membership";
import { MemberForm } from "@/features/staff/components/member-form";
import {
  ROLE_META,
  normalizeStaffRole,
} from "@/features/staff/constants/role-meta";

type Props = {
  params: Promise<{ role: string; membershipId: string }>;
};

export default async function EditMemberPage({ params }: Props) {
  const { role, membershipId } = await params;
  const orgId = await requireCurrentOrgId();
  const normalizedRole = normalizeStaffRole(role);

  if (!normalizedRole) {
    notFound();
  }

  const member = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      orgId,
      role: normalizedRole,
      user: {
        is: {
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          slug: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!member) {
    notFound();
  }

  const meta = ROLE_META[normalizedRole];
  const safeMember = member;

  async function submit(formData: FormData) {
    "use server";
    await updateMembership(safeMember.id, formData);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-5 p-5 sm:p-6">
          <Link
            href={`/staff/${normalizedRole.toLowerCase()}/${safeMember.id}`}
            className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <span className="mr-2" aria-hidden="true">
              ←
            </span>
            Back to profile
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                {meta.shortLabel}
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Edit organisation member
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  Edit {safeMember.user.fullName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Update this member’s profile and access role.
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
              {meta.label}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Username</p>
              <p className="mt-1 text-base font-semibold text-slate-950">
                {safeMember.user.username ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Role</p>
              <p className="mt-1 text-base font-semibold text-slate-950">
                {safeMember.role}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Member ID</p>
              <p className="mt-1 truncate text-base font-semibold text-slate-950">
                {safeMember.id}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <MemberForm
          action={submit}
          submitLabel="Update Member"
          defaultValues={{
            fullName: safeMember.user.fullName,
            email: safeMember.user.email ?? "",
            phone: safeMember.user.phone ?? "",
            role: safeMember.role,
          }}
        />
      </section>

      {normalizedRole === "CARETAKER" ? (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-950">
              Caretaker allocation management
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Apartment mapping should be managed as a dedicated caretaker
              assignment flow, not inside the generic member profile form.
            </p>

            <div className="mt-4">
              <Link
                href={`/staff/${normalizedRole.toLowerCase()}/${safeMember.id}`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
              >
                View caretaker profile and allocations
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}