#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");

function gitOriginal(relPath) {
  try {
    return execSync(`git show HEAD:${relPath}`, {
      encoding: "utf8",
      cwd: root,
    });
  } catch {
    return fs.readFileSync(path.join(root, relPath), "utf8");
  }
}

function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return content.split("\n").length;
}

function extractImports(src) {
  const m = src.match(/^([\s\S]*?)export const dynamic/m);
  return m ? `${m[1].trim()}\n\n` : "";
}

function splitAtReturn(src, pageFnName) {
  const re = new RegExp(
    `export default async function ${pageFnName}[\\s\\S]*?\\{([\\s\\S]*)\\n\\}\\s*$`,
  );
  const m = src.match(re);
  if (!m) throw new Error(`Page function not found: ${pageFnName}`);
  const body = m[1];
  const retIdx = body.lastIndexOf("return (");
  if (retIdx === -1) throw new Error(`Return not found: ${pageFnName}`);
  const pre = body.slice(0, retIdx).trim();
  const jsx = body.slice(retIdx + "return (".length).replace(/\);\s*$/, "");
  return { pre, jsx };
}

function exportFunctions(block) {
  return block.replace(/\nfunction /g, "\nexport function ");
}

function splitWorkspaceByMarker(workspaceSrc, marker, names) {
  const idx = workspaceSrc.indexOf(marker);
  if (idx === -1) return [workspaceSrc];
  const fnStart = workspaceSrc.indexOf("export function ");
  const returnStart = workspaceSrc.indexOf("  return (", fnStart);
  const preamble = workspaceSrc.slice(0, returnStart + "  return (".length);
  const close = "\n  );\n}\n";
  const innerStart = workspaceSrc.indexOf("(", returnStart) + 1;
  const innerEnd = workspaceSrc.lastIndexOf(");");
  const inner = workspaceSrc.slice(innerStart, innerEnd);
  const partA = inner.slice(0, idx);
  const partB = inner.slice(idx);
  const [nameA, nameB, composerName, composerImport] = names;
  const fileA = `${preamble}\n    <>\n${partA}    </>\n  ${close}`;
  const fileB = `${preamble.replace(
    /export function \w+/,
    `export function ${nameB}`,
  )}\n    <>\n${partB}    </>\n  ${close}`;
  const imports = workspaceSrc.slice(0, fnStart);
  const propsType = workspaceSrc.includes("export type ")
    ? workspaceSrc.slice(
        workspaceSrc.indexOf("export type "),
        workspaceSrc.indexOf("export function "),
      )
    : "";
  const composer = `${imports}import { ${nameA} } from "./${nameA
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "")
    .replace("jobs-overview-section", "jobs-overview-section")
    .replace("user-detail-main", "user-detail-main")
    .replace("user-detail-sidebar", "user-detail-sidebar")}";\nimport { ${nameB} } from "./${path.basename(
    nameB
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .replace(/^-/, ""),
  )}.tsx";\n\n${propsType}export function ${composerName}(props: ${propsType.match(/type (\w+)/)?.[1] || "unknown"}) {\n  return (\n    <>\n      <${nameA} {...props} />\n      <${nameB} {...props} />\n    </>\n  );\n}\n`;
  return { fileA, fileB, composer, imports, propsType };
}

const configs = [
  {
    path: "src/app/(app)/platform/users/[id]/page.tsx",
    pageFn: "PlatformUserDetailsPage",
    guard: "",
    lib: {
      helpers: { start: "function formatDate", end: "type PlatformUserDetailsPageProps" },
      types: { start: "type PlatformUserDetailsPageProps", end: "export default" },
    },
    ui: { start: "function MetricCard", end: "export default" },
    workspace: "src/app/(app)/platform/users/[id]/_components/user-detail-workspace.tsx",
    workspaceName: "UserDetailWorkspace",
    workspaceImports: `import Link from "next/link";
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
`,
    workspaceProps: `{
  details: Awaited<ReturnType<typeof getPlatformUserDetails>>;
  notice: ReturnType<typeof import("../_lib/helpers").getNotice>;
}`,
    pageImports: `import { getNotice } from "./_lib/helpers";
import { getPlatformUserDetails } from "./_lib/queries";
import type { PlatformUserDetailsPageProps } from "./_lib/types";
import { UserDetailWorkspace } from "./_components/user-detail-workspace";
`,
    pagePrelude: `  const { id } = await params;
  const paramsValue = await searchParams;
  const details = await getPlatformUserDetails(id);
  const notice = getNotice(paramsValue);`,
    workspacePass: "details={details} notice={notice}",
    splitMarker: '          <aside className="space-y-6">',
    splitNames: ["UserDetailMain", "UserDetailSidebar", "UserDetailWorkspace"],
  },
];

for (const cfg of configs) {
  const src = gitOriginal(cfg.path);
  const imports = extractImports(src);

  if (cfg.lib?.helpers) {
    const block = src.slice(
      src.indexOf(cfg.lib.helpers.start),
      src.indexOf(cfg.lib.helpers.end),
    );
    write(
      cfg.path.replace("page.tsx", "_lib/helpers.ts"),
      `${exportFunctions(block)}\n`,
    );
  }

  if (cfg.ui) {
    const block = src.slice(src.indexOf(cfg.ui.start), src.indexOf(cfg.ui.end));
    write(
      cfg.path.replace("page.tsx", "_components/user-detail-ui.tsx"),
      `${exportFunctions(block)}\n`,
    );
  }

  const { jsx } = splitAtReturn(src, cfg.pageFn);
  const propsType = `export type UserDetailWorkspaceProps = ${cfg.workspaceProps};\n\n`;
  let workspace = `${cfg.workspaceImports}\n${propsType}export function ${cfg.workspaceName}(props: UserDetailWorkspaceProps) {\n  const { user, grantedPermissions, revokedPermissions, isOrphanUser, archiveConfirmation, grantedPermissionSet } = props.details;\n  const { notice } = props;\n\n  return (\n${jsx}\n  );\n}\n`;

  if (cfg.splitMarker) {
    const idx = jsx.indexOf(cfg.splitMarker);
    if (idx !== -1) {
      const main = jsx.slice(0, idx);
      const sidebar = jsx.slice(idx);
      const baseImports = cfg.workspaceImports;
      write(
        cfg.path.replace("page.tsx", "_components/user-detail-main.tsx"),
        `${baseImports}\n${propsType}export function UserDetailMain(props: UserDetailWorkspaceProps) {\n  const { user, grantedPermissions, revokedPermissions, isOrphanUser, archiveConfirmation, grantedPermissionSet } = props.details;\n  const { notice } = props;\n\n  return (\n${main}\n  );\n}\n`,
      );
      write(
        cfg.path.replace("page.tsx", "_components/user-detail-sidebar.tsx"),
        `${baseImports}\n${propsType}export function UserDetailSidebar(props: UserDetailWorkspaceProps) {\n  const { user, grantedPermissions, revokedPermissions, isOrphanUser, archiveConfirmation, grantedPermissionSet } = props.details;\n\n  return (\n${sidebar}\n  );\n}\n`,
      );
      workspace = `${baseImports}
import { UserDetailMain } from "./user-detail-main";
import { UserDetailSidebar } from "./user-detail-sidebar";

${propsType}export function ${cfg.workspaceName}(props: UserDetailWorkspaceProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <UserDetailMain {...props} />
    </div>
  );
}
`;
      // Fix - the main section includes header and grid start; need to re-read structure
      workspace = `${baseImports}
import { UserDetailMain } from "./user-detail-main";
import { UserDetailSidebar } from "./user-detail-sidebar";

${propsType}export function ${cfg.workspaceName}(props: UserDetailWorkspaceProps) {
  return (
    <>
      <UserDetailMain {...props} />
      <UserDetailSidebar {...props} />
    </>
  );
}
`;
    }
  }

  write(cfg.workspace, workspace);

  const page = `${imports}${cfg.pageImports}
export const dynamic = "force-dynamic";

export default async function ${cfg.pageFn}({
  params,
  searchParams,
}: import("./_lib/types").PlatformUserDetailsPageProps) {
${cfg.pagePrelude}

  return <${cfg.workspaceName} ${cfg.workspacePass} />;
}
`;
  write(cfg.path, page);
  console.log("Done", cfg.path);
}