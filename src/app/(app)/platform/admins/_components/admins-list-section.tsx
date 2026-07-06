import type { AdminRecord } from "../_lib/types";
import { AdminsCard } from "./admins-ui";

export function AdminsListSection({ admins }: { admins: AdminRecord[] }) {
  return <AdminsCard admins={admins} />;
}