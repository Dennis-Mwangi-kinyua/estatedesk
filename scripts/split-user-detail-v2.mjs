import fs from "node:fs";

const jsx = fs.readFileSync("/tmp/split-userid/jsx.txt", "utf8");
const imports = `import Link from "next/link";
import { PlatformPermissionType, PlatformRole } from "@prisma/client";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Crown,
  KeyRound,
  LogIn,
  Mail,
  Phone,
  Save,
  Shield,
  Trash2,
  User2,
  Users,
  XCircle,
} from "lucide-react";
import {
  archiveOrphanPlatformUser,
  resetPlatformUserPassword,
  updatePlatformUserPermissions,
  updatePlatformUserProfile,
  updatePlatformUserStatus,
} from "../actions";
import { formatDate, getInitials } from "../_lib/helpers";
import type { getPlatformUserDetails } from "../_lib/queries";
import {
  ControlField,
  EmptyState,
  InfoRow,
  MetricCard,
  MiniTag,
  SummaryRow,
  Tag,
} from "./user-detail-ui";

export type UserDetailWorkspaceProps = {
  details: Awaited<ReturnType<typeof getPlatformUserDetails>>;
  notice: ReturnType<typeof import("../_lib/helpers").getNotice>;
};
`;

const asideMarker = '          <aside className="space-y-6">';
const sectionMarker = '          <section className="space-y-6">';
const idx = jsx.indexOf(asideMarker);
const sectionStart = jsx.indexOf(sectionMarker);
const headerBlock = jsx.slice(0, jsx.indexOf('      <div className="min-h-0 flex-1 overflow-auto px-6 py-6">')).trimEnd();
const scrollBlock = jsx.slice(
  jsx.indexOf('      <div className="min-h-0 flex-1 overflow-auto px-6 py-6">'),
  sectionStart,
);
const profileSection = jsx.slice(sectionStart, idx).trimEnd();
const sidebar = jsx.slice(idx, jsx.lastIndexOf("    </div>")).trimEnd();
const destructure =
  "  const { user, grantedPermissions, revokedPermissions, isOrphanUser, archiveConfirmation, grantedPermissionSet } = details;";

fs.writeFileSync(
  "src/app/(app)/platform/users/[id]/_components/user-detail-profile.tsx",
  `${imports}

export function UserDetailProfile({ details, notice }: UserDetailWorkspaceProps) {
${destructure}

  return (
${profileSection}
  );
}
`,
);

fs.writeFileSync(
  "src/app/(app)/platform/users/[id]/_components/user-detail-sidebar.tsx",
  `${imports}

export function UserDetailSidebar({ details }: UserDetailWorkspaceProps) {
${destructure}

  return (
${sidebar}
  );
}
`,
);

fs.writeFileSync(
  "src/app/(app)/platform/users/[id]/_components/user-detail-workspace.tsx",
  `${imports}
import { UserDetailProfile } from "./user-detail-profile";
import { UserDetailSidebar } from "./user-detail-sidebar";

export function UserDetailWorkspace({ details, notice }: UserDetailWorkspaceProps) {
  return (
${headerBlock}
${scrollBlock}
        {notice ? (
          <div
            className={\`mb-5 rounded-2xl border px-4 py-3 text-sm \${
              notice.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }\`}
          >
            {notice.message}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <UserDetailProfile details={details} notice={notice} />
          <UserDetailSidebar details={details} />
        </div>
      </div>
    </div>
  );
}
`,
);

for (const f of [
  "user-detail-profile.tsx",
  "user-detail-sidebar.tsx",
  "user-detail-workspace.tsx",
]) {
  console.log(
    f,
    fs
      .readFileSync(
        `src/app/(app)/platform/users/[id]/_components/${f}`,
        "utf8",
      )
      .split("\n").length,
  );
}