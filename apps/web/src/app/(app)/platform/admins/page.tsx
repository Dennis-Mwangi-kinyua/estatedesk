import { AdminsWorkspace } from "./_components/admins-workspace";
import { getPlatformAdmins } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function PlatformAdminsPage() {
  const admins = await getPlatformAdmins();

  return <AdminsWorkspace admins={admins} />;
}
