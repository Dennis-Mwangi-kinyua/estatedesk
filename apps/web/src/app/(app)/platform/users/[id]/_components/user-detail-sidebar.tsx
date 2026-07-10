import type { getPlatformUserDetails } from "../_lib/queries";
import { UserDetailAccountPanel } from "./user-detail-account-panel";
import {
  UserDetailEditPermissionsPanel,
  UserDetailPermissionsListPanel,
  UserDetailSummaryPanel,
} from "./user-detail-permissions-panels";
import {
  UserDetailEditUserPanel,
  UserDetailPasswordPanel,
} from "./user-detail-profile-panels";

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
      <UserDetailAccountPanel details={details} />
      <UserDetailEditUserPanel details={details} />
      <UserDetailPasswordPanel details={details} />
      <UserDetailPermissionsListPanel details={details} />
      <UserDetailEditPermissionsPanel details={details} />
      <UserDetailSummaryPanel details={details} />
    </aside>
  );
}