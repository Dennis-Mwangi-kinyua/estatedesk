import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return content.split("\n").length;
}

function exportFns(block) {
  return block
    .replace(/\nfunction /g, "\nexport function ")
    .replace(/\nasync function /g, "\nexport async function ");
}

function importsOf(src) {
  const m = src.match(/^([\s\S]*?)export const dynamic/m);
  return m ? `${m[1].trim()}\n\n` : "";
}

function parsePage(src, pageFn) {
  const re = new RegExp(
    `export default async function ${pageFn}[\\s\\S]*?return \\(([\\s\\S]*)\\);\\s*\\n\\}`,
  );
  const m = src.match(re);
  if (!m) throw new Error(`parse fail ${pageFn}`);
  const preRe = new RegExp(
    `export default async function ${pageFn}[\\s\\S]*?\\{([\\s\\S]*?)return \\(`,
  );
  return { jsx: m[1], pre: src.match(preRe)[1].trim() };
}

function splitWs(rel, marker, aName, bName, wrapper) {
  const full = path.join(root, rel);
  const ws = fs.readFileSync(full, "utf8");
  const idx = ws.indexOf(marker);
  if (idx === -1) return;
  const fnPos = ws.indexOf("export function ");
  const retPos = ws.indexOf("  return (", fnPos);
  const preamble = ws.slice(0, retPos + "  return (".length);
  const innerStart = ws.indexOf("(", retPos) + 1;
  const innerEnd = ws.lastIndexOf(");");
  const inner = ws.slice(innerStart, innerEnd);
  const splitAt = inner.indexOf(marker);
  const kebab = (n) => n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  write(rel.replace("workspace.tsx", `${kebab(aName)}.tsx`), `${preamble}\n    <>\n${inner.slice(0, splitAt)}    </>\n  );\n}\n`);
  write(rel.replace("workspace.tsx", `${kebab(bName)}.tsx`), `${preamble.replace(/export function \w+/, `export function ${bName}`)}\n    <>\n${inner.slice(splitAt)}    </>\n  );\n}\n`);
  const imports = ws.slice(0, fnPos);
  const typeIdx = ws.indexOf("export type ");
  const types = typeIdx >= 0 && typeIdx < fnPos ? `${ws.slice(typeIdx, fnPos)}\n` : "";
  const wName = ws.match(/export function (\w+)/)?.[1];
  const pType = ws.match(/type (\w+Props)/)?.[1] || `${wName}Props`;
  write(
    rel,
    `${imports}import { ${aName} } from "./${kebab(aName)}";
import { ${bName} } from "./${kebab(bName)}";
${types}export function ${wName}(props: ${pType}) {
  return (
${wrapper.replace("{{A}}", aName).replace("{{B}}", bName)}
  );
}
`,
  );
}

function modularize({
  gitTmp,
  relPath,
  pageFn,
  guard,
  helpersStart,
  helpersEnd = "export default",
  helpersOut,
  constantsOut,
  constantsStart,
  uiStart,
  uiOut,
  queriesOut,
  queriesFn,
  workspaceOut,
  workspaceImports,
  workspaceName,
  workspacePropsType,
  workspaceProps,
  workspaceDestructure,
  pageImports,
  pageArgs,
  pageBody,
  workspacePass,
  split,
}) {
  const src = fs.readFileSync(gitTmp, "utf8");
  const imports = importsOf(src);

  if (constantsOut && constantsStart) {
    const end = helpersStart;
    write(constantsOut, `${src.slice(src.indexOf(constantsStart), src.indexOf(end)).trim()}\n`);
  }

  if (helpersOut) {
    write(helpersOut, `${exportFns(src.slice(src.indexOf(helpersStart), src.indexOf(helpersEnd)))}\n`);
  }

  if (uiStart) {
    write(uiOut, `${exportFns(src.slice(src.indexOf(uiStart), src.indexOf("export default")))}\n`);
  }

  if (queriesOut) {
    write(queriesOut, queriesFn(src));
  }

  const { jsx } = parsePage(src, pageFn);
  write(
    workspaceOut,
    `${workspaceImports}
export type ${workspacePropsType} = ${workspaceProps};

export function ${workspaceName}(props: ${workspacePropsType}) {
${workspaceDestructure || ""}
  return (
${jsx}
  );
}
`,
  );

  if (split) {
    splitWs(workspaceOut, split.marker, split.a, split.b, split.wrapper);
  }

  write(
    relPath,
    `${imports}${pageImports}
export const dynamic = "force-dynamic";

export default async function ${pageFn}(${pageArgs}) {
${guard || ""}${pageBody}

  return <${workspaceName} ${workspacePass} />;
}
`,
  );

  console.log("OK", relPath);
}

// STAFF PAGE
modularize({
  gitTmp: "/tmp/git-src_app_(app)_staff_page.tsx",
  relPath: "src/app/(app)/staff/page.tsx",
  pageFn: "StaffPage",
  guard: "",
  helpersStart: "function formatDateTime",
  helpersOut: "src/app/(app)/staff/_lib/helpers.ts",
  uiStart: "function RolePill",
  uiOut: "src/app/(app)/staff/_components/staff-ui.tsx",
  queriesOut: "src/app/(app)/staff/_lib/queries.ts",
  queriesFn: (src) => {
    const pre = parsePage(src, "StaffPage").pre;
    return `import { getOnlineSince } from "@/lib/auth/presence";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES, type StaffRole } from "@/features/staff/constants/role-meta";

export async function getStaffDirectoryData(input: {
  orgId: string;
  skip: number;
  take: number;
}) {
${pre.replace(/const session = await requireUserSession\(\);[\s\S]*?if \(!session.activeOrgId\)[\s\S]*?\}\n\n/, "  ").replace(/const params = await searchParams;[\s\S]*?take,\s*\}\);/, "  const { orgId, skip, take } = input;")}
}
`;
  },
  workspaceOut: "src/app/(app)/staff/_components/staff-workspace.tsx",
  workspaceImports: `import Link from "next/link";
import { ROLE_META, STAFF_ROLES, type StaffRole } from "@/features/staff/constants/role-meta";
import { formatDateTime, formatRelative } from "../_lib/helpers";
import type { getStaffDirectoryData } from "../_lib/queries";
import { PresencePill, RolePill, StaffCard, StaffPagination, StatCard } from "./staff-ui";
`,
  workspaceName: "StaffWorkspace",
  workspacePropsType: "StaffWorkspaceProps",
  workspaceProps: "{ data: Awaited<ReturnType<typeof getStaffDirectoryData>>; now: Date }",
  workspaceDestructure: `  const { staff, totalStaff, groupedRoles, onlineStaffUsers, page, pageSize, roleCounts, rows } = props.data;
  const { now } = props;`,
  pageImports: `import { requireUserSession } from "@/lib/auth/session";
import { getPagination } from "@/lib/db/pagination";
import { getStaffDirectoryData } from "./_lib/queries";
import { StaffWorkspace } from "./_components/staff-workspace";
`,
  pageArgs: `{ searchParams }: { searchParams: Promise<{ page?: string; pageSize?: string }> }`,
  pageBody: `  const session = await requireUserSession();

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
  const now = new Date();
  const data = await getStaffDirectoryData({
    orgId: session.activeOrgId,
    skip,
    take,
  });`,
  workspacePass: "data={{ ...data, page, pageSize }} now={now}",
});

console.log("staff done - needs workspace destructure fix in queries");