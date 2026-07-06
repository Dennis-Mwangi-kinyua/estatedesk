import fs from "node:fs";

const src = fs.readFileSync(
  "src/app/(app)/platform/users/[id]/_components/user-detail-workspace.tsx",
  "utf8",
);
const lines = src.split("\n");
const impEnd = lines.findIndex((l) => l.startsWith("export type"));
const imports = lines.slice(0, impEnd).join("\n");
const types = lines.slice(impEnd, lines.findIndex((l) => l.startsWith("export function"))).join("\n");
const retIdx = lines.findIndex((l) => l.trim() === "return (");
const endIdx = lines.lastIndexOf("  );");
const jsx = lines.slice(retIdx + 1, endIdx);

const markers = {
  scrollStart: jsx.findIndex((l) => l.includes('className="min-h-0 flex-1 overflow-auto')),
  profileStart: jsx.findIndex((l) => l.includes('<section className="space-y-6">')),
  aside: jsx.findIndex((l) => l.includes("<aside className")),
  editPermissions: jsx.findIndex((l) => l.includes("Edit Permissions")),
};

const header = jsx.slice(0, markers.scrollStart).join("\n");
const profile = jsx.slice(markers.profileStart, markers.aside).join("\n");
const controlsAside = jsx.slice(markers.aside, markers.editPermissions).join("\n");
const permissionsAside = jsx.slice(markers.editPermissions).join("\n");

const destructure =
  "  const { user, grantedPermissions, revokedPermissions, isOrphanUser, archiveConfirmation, grantedPermissionSet } = details;";

function component(name, body, extraProps = "notice") {
  return `${imports}
${types}

export function ${name}({ details${extraProps ? ", notice" : ""} }: UserDetailWorkspaceProps) {
${destructure}

  return (
${body}
  );
}
`;
}

fs.writeFileSync(
  "src/app/(app)/platform/users/[id]/_components/user-detail-header.tsx",
  component("UserDetailHeader", header),
);
fs.writeFileSync(
  "src/app/(app)/platform/users/[id]/_components/user-detail-profile.tsx",
  component("UserDetailProfile", profile),
);
fs.writeFileSync(
  "src/app/(app)/platform/users/[id]/_components/user-detail-controls.tsx",
  component("UserDetailControls", controlsAside, ""),
);
fs.writeFileSync(
  "src/app/(app)/platform/users/[id]/_components/user-detail-permissions.tsx",
  component("UserDetailPermissions", permissionsAside, ""),
);

const workspace = `${imports}
import { UserDetailHeader } from "./user-detail-header";
import { UserDetailProfile } from "./user-detail-profile";
import { UserDetailControls } from "./user-detail-controls";
import { UserDetailPermissions } from "./user-detail-permissions";

${types}

export function UserDetailWorkspace(props: UserDetailWorkspaceProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <UserDetailHeader {...props} />
      <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
        {props.notice ? (
          <div
            className={\`mb-5 rounded-2xl border px-4 py-3 text-sm \${
              props.notice.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }\`}
          >
            {props.notice.message}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <UserDetailProfile {...props} />
          <aside className="space-y-6">
            <UserDetailControls {...props} />
            <UserDetailPermissions {...props} />
          </aside>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(
  "src/app/(app)/platform/users/[id]/_components/user-detail-workspace.tsx",
  workspace,
);

for (const f of [
  "user-detail-header.tsx",
  "user-detail-profile.tsx",
  "user-detail-controls.tsx",
  "user-detail-permissions.tsx",
  "user-detail-workspace.tsx",
]) {
  const n = fs
    .readFileSync(`src/app/(app)/platform/users/[id]/_components/${f}`, "utf8")
    .split("\n").length;
  console.log(f, n);
}