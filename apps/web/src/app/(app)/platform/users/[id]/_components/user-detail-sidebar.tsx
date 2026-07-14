import type { getPlatformUserDetails } from "../_lib/queries";
import {
  UserDetailPermissionsListPanel,
  UserDetailSummaryPanel,
} from "./user-detail-permissions-panels";

export type UserDetailWorkspaceProps = {
  details: Awaited<ReturnType<typeof getPlatformUserDetails>>;
  notice: ReturnType<typeof import("../_lib/helpers").getNotice>;
};

export function UserDetailSidebar({
  details,
}: {
  details: UserDetailWorkspaceProps["details"];
}) {
  return (
    <aside className="space-y-6">
      <UserDetailPermissionsListPanel details={details} />
      <UserDetailSummaryPanel details={details} />
    </aside>
  );
}
