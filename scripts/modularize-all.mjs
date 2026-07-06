import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");

function gitOriginal(rel) {
  try {
    return execSync(`git show 'HEAD:${rel}'`, { encoding: "utf8", cwd: root });
  } catch {
    return fs.readFileSync(path.join(root, rel), "utf8");
  }
}

function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return content.split("\n").length;
}

function importsOf(src) {
  const m = src.match(/^([\s\S]*?)export const dynamic/m);
  return m ? `${m[1].trim()}\n\n` : "";
}

function splitPage(src, pageFn) {
  const re = new RegExp(
    `export default async function ${pageFn}[\\s\\S]*?\\{([\\s\\S]*)\\n\\}\\s*$`,
  );
  const m = src.match(re);
  if (!m) throw new Error(`Missing page fn ${pageFn}`);
  const body = m[1];
  const ret = body.lastIndexOf("return (");
  return {
    pre: body.slice(0, ret).trim(),
    jsx: body.slice(ret + "return (".length).replace(/\);\s*$/, ""),
  };
}

function exportFns(block) {
  return block.replace(/\nfunction /g, "\nexport function ").replace(/\nasync function /g, "\nexport async function ");
}

function splitWorkspaceFile(relWorkspace, marker, nameA, nameB) {
  const src = fs.readFileSync(path.join(root, relWorkspace), "utf8");
  const idx = src.indexOf(marker);
  if (idx === -1) return false;
  const fn = src.indexOf("export function ");
  const ret = src.indexOf("  return (", fn);
  const preamble = src.slice(0, ret + "  return (".length);
  const innerStart = src.indexOf("(", ret) + 1;
  const innerEnd = src.lastIndexOf(");");
  const inner = src.slice(innerStart, innerEnd);
  const split = inner.indexOf(marker);
  const kebab = (s) =>
    s.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();
  const a = inner.slice(0, split);
  const b = inner.slice(split);
  write(
    relWorkspace.replace("workspace.tsx", `${kebab(nameA)}.tsx`),
    `${preamble}\n    <>\n${a}    </>\n  );\n}\n`,
  );
  write(
    relWorkspace.replace("workspace.tsx", `${kebab(nameB)}.tsx`),
    `${preamble.replace(/export function \w+/, `export function ${nameB}`)}\n    <>\n${b}    </>\n  );\n}\n`,
  );
  const imports = src.slice(0, fn);
  const typeBlock = src.includes("export type ")
    ? `${src.slice(src.indexOf("export type "), fn)}\n`
    : "";
  const composer = `${imports}import { ${nameA} } from "./${kebab(nameA)}";
import { ${nameB} } from "./${kebab(nameB)}";
${typeBlock}
export function ${src.match(/export function (\w+)/)?.[1]}(props: ${src.match(/type (\w+Props)/)?.[1]}) {
  return (
    <>
      <${nameA} {...props} />
      <${nameB} {...props} />
    </>
  );
}
`;
  write(relWorkspace, composer);
  return true;
}

const pages = [
  {
    path: "src/app/(app)/platform/users/page.tsx",
    pageFn: "PlatformUsersPage",
    guard: `  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

`,
    helpers: { start: "const ROLE_VALUES", end: "export default" },
    ui: { start: "function RoleCard", end: "export default" },
    workspaceImports: `import Link from "next/link";
import { PlatformRole, UserStatus } from "@prisma/client";
import { ArrowUpRight, Crown, KeyRound, Mail, Phone, Plus, Search, Shield, Trash2, User2 } from "lucide-react";
import { createPlatformUserAction } from "./actions";
import { Badge, PageHeader, PaginationControls, StatCard, formatDateTime, formatNumber, toneForStatus } from "../_components/control-plane";
import { CREATE_ERROR_MESSAGES, PLATFORM_ROLE_META, ROLE_VALUES, STATUS_VALUES } from "./_lib/constants";
import { buildWhere, formatPermission, getInitials, parseRole, parseStatus } from "./_lib/helpers";
import type { getPlatformUsersPageData } from "./_lib/queries";
import { CreatePlatformUserPanel, InfoPill, PreviewBlock, RoleCard } from "./_components/users-ui";
`,
    workspaceName: "UsersWorkspace",
    workspaceProps: `{ data: Awaited<ReturnType<typeof getPlatformUsersPageData>>; flash: { created?: string; createError?: string; archived?: string } }`,
    pageImports: `import { requirePlatformRole } from "@/lib/permissions/guards";
import { getPlatformUsersPageData } from "./_lib/queries";
import { UsersWorkspace } from "./_components/users-workspace";
`,
    prelude: (pre) => pre,
    splitMarker: '      <CreatePlatformUserPanel />',
    splitA: "UsersSummary",
    splitB: "UsersDirectory",
  },
];

for (const cfg of pages) {
  const src = gitOriginal(cfg.path);
  const imports = importsOf(src);

  if (cfg.helpers) {
    const block = src.slice(src.indexOf(cfg.helpers.start), src.indexOf(cfg.helpers.end));
    const constPart = block.slice(0, block.indexOf("function "));
    const fnPart = block.slice(block.indexOf("function "));
    write(
      cfg.path.replace("page.tsx", "_lib/constants.ts"),
      `import { PlatformPermissionType, PlatformRole, UserStatus } from "@prisma/client";\n\nexport ${constPart.trim()}\n`,
    );
    write(cfg.path.replace("page.tsx", "_lib/helpers.ts"), `${exportFns(fnPart)}\n`);
  }

  if (cfg.ui) {
    const block = src.slice(src.indexOf(cfg.ui.start), src.indexOf(cfg.ui.end));
    write(cfg.path.replace("page.tsx", "_components/users-ui.tsx"), `${exportFns(block)}\n`);
  }

  const { pre, jsx } = splitPage(src, cfg.pageFn);
  write(
    cfg.path.replace("page.tsx", "_lib/queries.ts"),
    `import { PlatformRole, Prisma, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { getPagination } from "@/lib/db/pagination";
import { buildWhere, parseRole, parseStatus } from "./helpers";

export async function getPlatformUsersPageData(params: {
  page: number;
  pageSize: number;
  q: string;
  role: PlatformRole | null;
  status: UserStatus | null;
}) {
${pre.replace(/const params = await searchParams;[\s\S]*?const where = buildWhere[\s\S]*?;/, (m) => m).replace(/const users = await/, "  const users = await").replace(/return \(/, "").trim()}
}
`,
  );

  const ws = `${cfg.workspaceImports}
export type UsersWorkspaceProps = ${cfg.workspaceProps};

export function ${cfg.workspaceName}(props: UsersWorkspaceProps) {
  const { data, flash } = props;
  const { users, totalFiltered, totalUsers, totalAdmins, activeUsers, page, pageSize, q, role, status } = data;
  const params = flash;

  return (
${jsx}
  );
}
`;
  write(cfg.path.replace("page.tsx", "_components/users-workspace.tsx"), ws);

  const page = `${imports}${cfg.pageImports}
export const dynamic = "force-dynamic";

export default async function ${cfg.pageFn}({
  searchParams,
}: {
  searchParams: import("./_lib/types").UsersSearchParams;
}) {
${cfg.guard}${pre
    .replace(/const users = await[\s\S]*?activeUsers =[\s\S]*?;/, "  const data = await getPlatformUsersPageData({ page, pageSize, skip, take, q, role, status } as any);")
    .split("\n")
    .filter((l) => !l.includes("prisma.") && !l.includes("retryTransient"))
    .join("\n")}

  return <${cfg.workspaceName} data={data} flash={params} />;
}
`;
  // Too hacky - skip auto queries for users, do manually
  console.log("skip complex", cfg.path);
}