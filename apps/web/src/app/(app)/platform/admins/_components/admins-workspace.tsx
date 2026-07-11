import type { AdminRecord } from "../_lib/types";
import { AdminsListSection } from "./admins-list-section";
import { CreateAdminSection } from "./create-admin-section";
import { PageHeader } from "./admins-ui";

export type AdminsWorkspaceProps = {
  admins: AdminRecord[];
};

export function AdminsWorkspace({ admins }: AdminsWorkspaceProps) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-6">
      <PageHeader />
      <CreateAdminSection />
      <AdminsListSection admins={admins} />
    </div>
  );
}
