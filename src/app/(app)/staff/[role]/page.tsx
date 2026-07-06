import { notFound } from "next/navigation";
import {
  normalizeStaffRole,
} from "@/features/staff/constants/role-meta";
import { RoleMembersWorkspace } from "./_components/role-members-workspace";
import { getRoleMembersDirectoryData } from "./_lib/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ role: string }>;
};

export default async function RoleMembersPage({ params }: Props) {
  const { role } = await params;
  const normalizedRole = normalizeStaffRole(role);

  if (!normalizedRole) {
    notFound();
  }

  const data = await getRoleMembersDirectoryData(normalizedRole);

  return <RoleMembersWorkspace data={data} />;
}