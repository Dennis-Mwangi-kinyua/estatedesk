import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { deleteMembership } from "@/features/staff/actions/delete-membership";

type Props = {
  params: Promise<{ role: string; memberId: string }>;
};

export default async function MemberDetailPage({ params }: Props) {
  const { role, memberId } = await params;
  const orgId = await requireCurrentOrgId();

  const member = await prisma.membership.findFirst({
    where: {
      id: memberId,
      orgId,
    },
    select: {
      id: true,
      role: true,
      scopeType: true,
      createdAt: true,
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    },
  });

  if (!member) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{member.user.fullName}</h1>
        <p className="mt-2 text-neutral-600">{member.user.email ?? "No email"}</p>

        <div className="mt-6 space-y-2 text-sm text-neutral-700">
          <p>Role: {member.role}</p>
          <p>Phone: {member.user.phone ?? "—"}</p>
          <p>Status: {member.user.status}</p>
          <p>Scope: {member.scopeType}</p>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href={`/staff/${role}/${member.id}/edit`}
            className="rounded-2xl border px-4 py-2"
          >
            Edit
          </Link>

          <form
            action={async () => {
              "use server";
              await deleteMembership(member.id);
            }}
          >
            <button className="rounded-2xl bg-red-600 px-4 py-2 text-white">
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}