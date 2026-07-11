import type { AdminRecord } from "../_lib/types";
import { AdminsCard } from "./admins-ui";

export function AdminsListSection({
  admins,
}: {
  admins: AdminRecord[];
}) {
  const activeAdminCount = admins.filter(
    (admin) => admin.status === "ACTIVE",
  ).length;

  return (
    <AdminsCard admins={admins} activeAdminCount={activeAdminCount} />
  );
}
