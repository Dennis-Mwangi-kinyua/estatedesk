import type { AdminRecord } from "../_lib/types";
import { AdminsListSection } from "./admins-list-section";
import { CreateAdminSection } from "./create-admin-section";
import { PageHeader } from "./admins-ui";

export type AdminsWorkspaceProps = {
  admins: AdminRecord[];
};

export function AdminsWorkspace({ admins }: AdminsWorkspaceProps) {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader />
      <CreateAdminSection />
      <AdminsListSection admins={admins} />
    </div>
  );
}
