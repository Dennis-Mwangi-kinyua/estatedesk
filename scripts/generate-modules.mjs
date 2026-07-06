import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return content.split("\n").length;
}

function readTmp(name, file) {
  return fs.readFileSync(`/tmp/split-${name}/${file}`, "utf8");
}

function readGit(rel) {
  const name = rel.replace(/[\/\[\]]/g, "_");
  return fs.readFileSync(`/tmp/git-${name}`, "utf8");
}

function helpersBeforeExport(gitSrc, exportMarker = "export default") {
  const start = gitSrc.indexOf("export const dynamic");
  const end = gitSrc.indexOf(exportMarker);
  const block = gitSrc.slice(start, end);
  const fnStart = block.indexOf("function ");
  const asyncStart = block.indexOf("async function ");
  const first = Math.min(
    fnStart === -1 ? Infinity : fnStart,
    asyncStart === -1 ? Infinity : asyncStart,
  );
  if (first === Infinity) return "";
  return block
    .slice(first)
    .replace(/\nfunction /g, "\nexport function ")
    .replace(/\nasync function /g, "\nexport async function ");
}

function uiAfterExport(gitSrc, pageFn) {
  const start = gitSrc.indexOf(`export default async function ${pageFn}`);
  const tail = gitSrc.slice(start);
  const relNext = tail.slice(1).search(/\nfunction [A-Z]/);
  if (relNext === -1) return "";
  return tail
    .slice(1 + relNext)
    .replace(/\nfunction /g, "\nexport function ");
}

function splitWs(content, marker, a, b, wrapper) {
  const idx = content.indexOf(marker);
  if (idx === -1) return content;
  const ret = content.indexOf("  return (");
  const innerStart = content.indexOf("(", ret) + 1;
  const innerEnd = content.lastIndexOf(");");
  const inner = content.slice(innerStart, innerEnd);
  const splitAt = inner.indexOf(marker);
  const kebab = (n) => n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return { inner, splitAt, kebab, a, b, wrapper, preamble: content.slice(0, ret + "  return (".length), head: content.slice(0, content.indexOf("export function ")) };
}

// STAFF
{
  const pre = readTmp("staff", "pre.txt");
  const jsx = readTmp("staff", "jsx.txt");
  const git = readGit("src/app/(app)/staff/page.tsx");
  write("src/app/(app)/staff/_lib/helpers.ts", `${helpersBeforeExport(git, "export default")}\n`);
  write(
    "src/app/(app)/staff/_lib/queries.ts",
    `import { getOnlineSince } from "@/lib/auth/presence";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES, type StaffRole } from "@/features/staff/constants/role-meta";

export async function getStaffDirectoryData(input: {
  orgId: string;
  skip: number;
  take: number;
  page: number;
  pageSize: number;
}) {
  const { orgId, skip, take, page, pageSize } = input;
  const now = new Date();
  const onlineSince = getOnlineSince(now);
${pre
  .replace(/const session = await requireUserSession\(\);[\s\S]*?pageSize: Number\(params.pageSize \?\? 20\),\s*\}\);/, "")
  .replace(/const params = await searchParams;\s*/, "")
  .replace(/const \{ page, pageSize, skip, take \} = getPagination\([\s\S]*?\);\s*/, "")
  .replace(/const now = new Date\(\);\s*/, "")
  .replace(/const onlineSince = getOnlineSince\(now\);\s*/, "")
  .replace(/session\.activeOrgId/g, "orgId")}

  return {
    staff,
    totalStaff,
    groupedRoles,
    onlineStaffUsers,
    roleCounts,
    rows,
    page,
    pageSize,
    now,
  };
}
`,
  );
  write("src/app/(app)/staff/_components/staff-ui.tsx", `${uiAfterExport(git, "StaffPage")}\n`);
  write(
    "src/app/(app)/staff/_components/staff-workspace.tsx",
    `import Link from "next/link";
import { ROLE_META, STAFF_ROLES } from "@/features/staff/constants/role-meta";
import { formatDateTime, formatRelative } from "../_lib/helpers";
import type { getStaffDirectoryData } from "../_lib/queries";
import { PresencePill, RolePill, StaffCard, StaffPagination, StatCard } from "./staff-ui";

export type StaffWorkspaceProps = {
  data: Awaited<ReturnType<typeof getStaffDirectoryData>>;
};

export function StaffWorkspace({ data }: StaffWorkspaceProps) {
  const {
    totalStaff,
    onlineStaffUsers,
    roleCounts,
    rows,
    page,
    pageSize,
    now,
  } = data;

  return (
${jsx}
  );
}
`,
  );
  write(
    "src/app/(app)/staff/page.tsx",
    `import Link from "next/link";
import { getOnlineSince } from "@/lib/auth/presence";
import { requireUserSession } from "@/lib/auth/session";
import { getPagination } from "@/lib/db/pagination";
import { prisma } from "@/lib/prisma";
import { ROLE_META, STAFF_ROLES, type StaffRole } from "@/features/staff/constants/role-meta";
import { StaffWorkspace } from "./_components/staff-workspace";
import { getStaffDirectoryData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
        No active organisation found for your account.
      </div>
    );
  }

  const params = await searchParams;
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 20),
  });
  const data = await getStaffDirectoryData({
    orgId: session.activeOrgId,
    skip,
    take,
    page,
    pageSize,
  });

  return <StaffWorkspace data={data} />;
}
`,
  );
  console.log("staff ok");
}

// AUDIT LOGS
{
  const git = readGit("src/app/(app)/platform/audit-logs/page.tsx");
  const pre = readTmp("audit", "pre.txt");
  const jsx = readTmp("audit", "jsx.txt");
  const helpers = helpersBeforeExport(git, "export default async function PlatformAuditLogsPage");
  write("src/app/(app)/platform/audit-logs/_lib/helpers.ts", `${helpers.replace(/async function getAuditLogs/, "export async function getAuditLogs")}\n`);
  write("src/app/(app)/platform/audit-logs/_lib/types.ts", `export type AuditLogsSearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
  action?: string;
}>;
`);
  write("src/app/(app)/platform/audit-logs/_components/audit-logs-ui.tsx", `${uiAfterExport(git, "PlatformAuditLogsPage")}\n`);
  write(
    "src/app/(app)/platform/audit-logs/_components/audit-logs-workspace.tsx",
    `import { FiltersCard, EmptyState, MobileLogList, DesktopTable, Pagination } from "./audit-logs-ui";

export type AuditLogsWorkspaceProps = {
  q: string;
  action: string;
  pageSize: number;
  page: number;
  logs: Awaited<ReturnType<typeof import("../_lib/helpers").getAuditLogs>>["logs"];
  totalCount: number;
  totalPages: number;
  actions: string[];
};

export function AuditLogsWorkspace(props: AuditLogsWorkspaceProps) {
  const { q, action, pageSize, page, logs, totalCount, totalPages, actions } = props;
  return (
${jsx}
  );
}
`,
  );
  write(
    "src/app/(app)/platform/audit-logs/page.tsx",
    `${git.match(/^import[\s\S]*?export const dynamic = "force-dynamic";\n\n/)[0]}import { getAuditLogs } from "./_lib/helpers";
import type { AuditLogsSearchParams } from "./_lib/types";
import { AuditLogsWorkspace } from "./_components/audit-logs-workspace";

export default async function PlatformAuditLogsPage({
  searchParams,
}: {
  searchParams: AuditLogsSearchParams;
}) {
${pre}

  return (
    <AuditLogsWorkspace
      q={q}
      action={action}
      pageSize={pageSize}
      page={page}
      logs={logs}
      totalCount={totalCount}
      totalPages={totalPages}
      actions={actions}
    />
  );
}
`,
  );
  console.log("audit ok");
}

console.log("done");