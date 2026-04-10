import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { updateMembership } from "@/features/staff/actions/update-membership";
import { MemberForm } from "@/features/staff/components/member-form";

type Props = {
  params: Promise<{ role: string; slug: string }>;
};

export default async function EditMemberPage({ params }: Props) {
  const { slug } = await params;
  const orgId = await requireCurrentOrgId();

  const member = await prisma.membership.findFirst({
    where: {
      orgId,
      user: {
        slug,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          slug: true,
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

  const safeMember = member;

  async function submit(formData: FormData) {
    "use server";
    await updateMembership(safeMember.id, formData);
  }

  return (
    <div className="max-w-2xl rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-neutral-950">Edit Member</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Update this organisation member’s profile and access role.
      </p>

      <div className="mt-6">
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
      </div>
    </div>
  );
}