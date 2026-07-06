import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");

function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return content.split("\n").length;
}

function gitPath(rel) {
  return `/tmp/git-${rel.replace(/[\/\[\]]/g, "_")}`;
}

function extract(gitTmp, pageFn) {
  const src = fs.readFileSync(gitTmp, "utf8");
  const start = src.indexOf(`export default async function ${pageFn}`);
  const tail = src.slice(start + 1);
  const relNext = tail.search(/\nfunction [A-Z]/);
  const nextFn = relNext === -1 ? -1 : start + 1 + relNext;
  const chunk = nextFn === -1 ? src.slice(start) : src.slice(start, nextFn);
  const open = chunk.indexOf("{");
  const endMarker = chunk.indexOf("\n}\n\nfunction ");
  const bodyEnd = endMarker === -1 ? chunk.lastIndexOf("\n}") : endMarker;
  const body = chunk.slice(open + 1, bodyEnd);
  const retMatch = [...body.matchAll(/\n {2}return \(/g)].pop();
  const retIdx = retMatch ? retMatch.index + 1 : body.lastIndexOf("return (");
  return {
    imports: (src.match(/^([\s\S]*?)export const dynamic/m) || ["", ""])[1].trim(),
    pre: body.slice(0, retIdx).trim(),
    jsx: body.slice(retIdx + "return (".length).replace(/\);\s*$/, ""),
    uiAfter: relNext === -1 ? "" : tail.slice(relNext).replace(/\nfunction /g, "\nexport function "),
    beforePage: src.slice(src.indexOf("export const dynamic"), start),
  };
}

function helpersFromBeforePage(beforePage) {
  const fn = beforePage.search(/\n(function |async function )/);
  if (fn === -1) return "";
  return beforePage
    .slice(fn)
    .replace(/\nfunction /g, "\nexport function ")
    .replace(/\nasync function /g, "\nexport async function ");
}

function splitLargeWorkspace(rel, marker, a, b) {
  const full = path.join(root, rel);
  let ws = fs.readFileSync(full, "utf8");
  const idx = ws.indexOf(marker);
  if (idx === -1) return;
  const ret = ws.indexOf("  return (");
  const innerStart = ws.indexOf("(", ret) + 1;
  const innerEnd = ws.lastIndexOf(");");
  const inner = ws.slice(innerStart, innerEnd);
  const splitAt = inner.indexOf(marker);
  const kebab = (n) => n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  const head = ws.slice(0, ws.indexOf("export function "));
  const props = ws.includes("export type ")
    ? ws.slice(ws.indexOf("export type "), ws.indexOf("export function "))
    : "";
  const wName = ws.match(/export function (\w+)/)?.[1];
  const pType = ws.match(/type (\w+)/)?.[1];
  write(rel.replace("workspace.tsx", `${kebab(a)}.tsx`), `${head}${props}export function ${a}(props: ${pType}) {\n  return (\n    <>\n${inner.slice(0, splitAt)}    </>\n  );\n}\n`);
  write(rel.replace("workspace.tsx", `${kebab(b)}.tsx`), `${head}${props}export function ${b}(props: ${pType}) {\n  return (\n    <>\n${inner.slice(splitAt)}    </>\n  );\n}\n`);
  write(rel, `${head}import { ${a} } from "./${kebab(a)}";
import { ${b} } from "./${kebab(b)}";
${props}export function ${wName}(props: ${pType}) {
  return (
    <>
      <${a} {...props} />
      <${b} {...props} />
    </>
  );
}
`);
}

const jobs = [
  {
    git: gitPath("src/app/(app)/platform/audit-logs/page.tsx"),
    rel: "src/app/(app)/platform/audit-logs/page.tsx",
    pageFn: "PlatformAuditLogsPage",
    guard: "",
    helpersOut: "src/app/(app)/platform/audit-logs/_lib/helpers.ts",
    uiOut: "src/app/(app)/platform/audit-logs/_components/audit-logs-ui.tsx",
    workspaceOut: "src/app/(app)/platform/audit-logs/_components/audit-logs-workspace.tsx",
    workspaceName: "AuditLogsWorkspace",
    workspaceImports: `import { FiltersCard, EmptyState, MobileLogList, DesktopTable, Pagination } from "./audit-logs-ui";
import type { getAuditLogs } from "../_lib/helpers";
`,
    workspaceProps: `{
  q: string;
  action: string;
  pageSize: number;
  page: number;
  logs: Awaited<ReturnType<typeof getAuditLogs>>["logs"];
  totalCount: number;
  totalPages: number;
  actions: string[];
}`,
    pageImports: `import { getAuditLogs, getPageNumber, getPageSize } from "./_lib/helpers";
import type { AuditLogsSearchParams } from "./_lib/types";
import { AuditLogsWorkspace } from "./_components/audit-logs-workspace";
`,
    pageArgs: `{ searchParams }: { searchParams: AuditLogsSearchParams }`,
    workspacePass: `q={q} action={action} pageSize={pageSize} page={page} logs={logs} totalCount={totalCount} totalPages={totalPages} actions={actions}`,
    typesOut: `export type AuditLogsSearchParams = Promise<{ page?: string; pageSize?: string; q?: string; action?: string }>;`,
  },
];

for (const job of jobs) {
  const { imports, pre, jsx, uiAfter, beforePage } = extract(job.git, job.pageFn);
  write(job.helpersOut, `${helpersFromBeforePage(beforePage)}\n`);
  if (job.typesOut) write(job.helpersOut.replace("helpers.ts", "types.ts"), job.typesOut);
  if (uiAfter) write(job.uiOut, `${imports}\n${uiAfter}\n`);
  write(
    job.workspaceOut,
    `${job.workspaceImports}
export type ${job.workspaceName}Props = ${job.workspaceProps};

export function ${job.workspaceName}(props: ${job.workspaceName}Props) {
  const { q, action, pageSize, page, logs, totalCount, totalPages, actions } = props;
  return (
${jsx}
  );
}
`,
  );
  write(
    job.rel,
    `${imports}
${job.pageImports}
export const dynamic = "force-dynamic";

export default async function ${job.pageFn}(${job.pageArgs}) {
${pre}

  return <${job.workspaceName} ${job.workspacePass} />;
}
`,
  );
  console.log("OK", job.rel);
}

// MARKETING
{
  const git = gitPath("src/app/(app)/platform/marketing/page.tsx");
  const { imports, pre, jsx, beforePage } = extract(git, "PlatformMarketingPage");
  write(
    "src/app/(app)/platform/marketing/_lib/helpers.ts",
    `${helpersFromBeforePage(beforePage)}\n`,
  );
  write(
    "src/app/(app)/platform/marketing/_lib/queries.ts",
    `${beforePage.slice(beforePage.indexOf("async function loadPlatformMarketingData"))}\n`.replace(
      "async function loadPlatformMarketingData",
      "export async function loadPlatformMarketingData",
    ),
  );
  write(
    "src/app/(app)/platform/marketing/_components/marketing-ui.tsx",
    `${imports}
${fs.readFileSync(git, "utf8").slice(fs.readFileSync(git, "utf8").indexOf("function InfoTile")).replace(/\nfunction /g, "\nexport function ")}
`,
  );
  write(
    "src/app/(app)/platform/marketing/_components/marketing-workspace.tsx",
    `${imports.replace(/import[\s\S]*?from "\.\/marketing-forms";/, `import { APP_PLANS } from "@/lib/billing/plans";
import { AdminLink, Badge, EmptyRow, PageHeader, StatCard, Surface, formatCurrency, formatDateTime, toneForStatus } from "../_components/control-plane";
import { AttributionForm, CreateMarketerForm, MarketerUpdateForm } from "../marketing-forms";
import { formatPercent, toNumber, estimateMonthlyCommission } from "../_lib/helpers";
import type { loadPlatformMarketingData } from "../_lib/queries";
import { EmptyState, InfoTile } from "./marketing-ui";`)}

export type MarketingWorkspaceProps = {
  degraded: boolean;
  marketers: Awaited<ReturnType<typeof loadPlatformMarketingData>>["marketers"];
  leads: Awaited<ReturnType<typeof loadPlatformMarketingData>>["leads"];
  organizations: Awaited<ReturnType<typeof loadPlatformMarketingData>>["organizations"];
  unassignedLeads: number;
  unassignedOrgs: number;
  activeMarketers: ReturnType<typeof import("../_lib/helpers").estimateMonthlyCommission> extends number ? never : never;
  marketerOptions: { id: string; fullName: string; referralCode: string }[];
  attributedLeads: number;
  attributedOrgs: number;
  estimatedMonthlyCommission: number;
};

export function MarketingWorkspace(props: MarketingWorkspaceProps) {
  const {
    degraded,
    marketers,
    leads,
    organizations,
    unassignedLeads,
    unassignedOrgs,
    activeMarketers,
    marketerOptions,
    attributedLeads,
    attributedOrgs,
    estimatedMonthlyCommission,
  } = props as MarketingWorkspaceProps & { activeMarketers: unknown };

  return (
${jsx}
  );
}
`,
  );
  write(
    "src/app/(app)/platform/marketing/page.tsx",
    `${imports}
import { requirePlatformRole } from "@/lib/permissions/guards";
import { estimateMonthlyCommission, formatPercent, toNumber } from "./_lib/helpers";
import { loadPlatformMarketingData } from "./_lib/queries";
import { MarketingWorkspace } from "./_components/marketing-workspace";

export const dynamic = "force-dynamic";

export default async function PlatformMarketingPage() {
${pre}

  return (
    <MarketingWorkspace
      degraded={degraded}
      marketers={marketers}
      leads={leads}
      organizations={organizations}
      unassignedLeads={unassignedLeads}
      unassignedOrgs={unassignedOrgs}
      activeMarketers={activeMarketers}
      marketerOptions={marketerOptions}
      attributedLeads={attributedLeads}
      attributedOrgs={attributedOrgs}
      estimatedMonthlyCommission={estimatedMonthlyCommission}
    />
  );
}
`,
  );
  splitLargeWorkspace(
    "src/app/(app)/platform/marketing/_components/marketing-workspace.tsx",
    '      <Surface title="Recent leads">',
    "MarketingMarketersSection",
    "MarketingLeadsOrgsSection",
  );
  console.log("OK marketing");
}

console.log("finish complete");