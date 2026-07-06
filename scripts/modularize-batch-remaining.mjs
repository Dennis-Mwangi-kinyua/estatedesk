import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function w(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return content.split("\n").length;
}

function git(rel) {
  const key = `/tmp/git-${rel.replace(/[\/\[\]]/g, "_")}`;
  if (fs.existsSync(key)) return fs.readFileSync(key, "utf8");
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function extract(gitTmp, pageFn) {
  const src = fs.readFileSync(gitTmp, "utf8");
  const imports = (src.match(/^([\s\S]*?)export const dynamic/m) || ["", ""])[1].trim();
  const start = src.indexOf(`export default async function ${pageFn}`);
  if (start === -1) throw new Error(`Missing ${pageFn} in ${gitTmp}`);
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
  const pre = body.slice(0, retIdx).trim();
  const jsx = body.slice(retIdx + "return (".length).replace(/\);\s*$/, "");
  const uiAfter =
    nextFn === -1 ? "" : tail.slice(relNext).replace(/\nfunction /g, "\nexport function ");
  const beforePage = src.slice(src.indexOf("export const dynamic"), start);
  return { imports, pre, jsx, uiAfter, beforePage, src };
}

function helpersFromBefore(beforePage) {
  const fn = beforePage.search(/\n(function |async function )/);
  if (fn === -1) return "";
  return beforePage
    .slice(fn)
    .replace(/\nfunction /g, "\nexport function ")
    .replace(/\nasync function /g, "\nexport async function ");
}

function splitWorkspace(rel, marker, nameA, nameB) {
  const full = path.join(root, rel);
  const src = fs.readFileSync(full, "utf8");
  const idx = src.indexOf(marker);
  if (idx === -1) return false;
  const fn = src.indexOf("export function ");
  const ret = src.indexOf("  return (", fn);
  const preamble = src.slice(0, ret + "  return (".length);
  const innerStart = src.indexOf("(", ret) + 1;
  const innerEnd = src.lastIndexOf(");");
  const inner = src.slice(innerStart, innerEnd);
  const split = inner.indexOf(marker);
  const kebab = (s) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  const typeBlock = src.includes("export type ")
    ? `${src.slice(src.indexOf("export type "), fn)}\n`
    : "";
  const imports = src.slice(0, fn);
  const wName = src.match(/export function (\w+)/)?.[1];
  const pType = src.match(/type (\w+Props)/)?.[1];
  w(
    rel.replace("workspace.tsx", `${kebab(nameA)}.tsx`),
    `${imports}${typeBlock}export function ${nameA}(props: ${pType}) {\n  return (\n    <>\n${inner.slice(0, split)}    </>\n  );\n}\n`,
  );
  w(
    rel.replace("workspace.tsx", `${kebab(nameB)}.tsx`),
    `${imports}${typeBlock}export function ${nameB}(props: ${pType}) {\n  return (\n    <>\n${inner.slice(split)}    </>\n  );\n}\n`,
  );
  w(
    rel,
    `${imports}import { ${nameA} } from "./${kebab(nameA)}";
import { ${nameB} } from "./${kebab(nameB)}";
${typeBlock}export function ${wName}(props: ${pType}) {
  return (
    <>
      <${nameA} {...props} />
      <${nameB} {...props} />
    </>
  );
}
`,
  );
  return true;
}

// ─── ADMINS ───────────────────────────────────────────────────────────────────
{
  const rel = "src/app/(app)/platform/admins/page.tsx";
  const g = git(rel);
  const { imports, pre, jsx, uiAfter, beforePage } = extract(
    `/tmp/git-${rel.replace(/[\/\[\]]/g, "_")}`,
    "PlatformAdminsPage",
  );

  const constBlock = beforePage.slice(
    beforePage.indexOf("const dateFormatter"),
    beforePage.indexOf("function formatDate"),
  );
  const helpersBlock = beforePage
    .slice(beforePage.indexOf("function formatDate"), beforePage.indexOf("const adminSelect"))
    .replace("function formatDate", "export function formatDate");
  const typesBlock = beforePage.slice(
    beforePage.indexOf("const adminSelect"),
    beforePage.indexOf("async function getPlatformAdmins"),
  );
  const queryBlock = beforePage
    .slice(beforePage.indexOf("async function getPlatformAdmins"), beforePage.indexOf("function normalizeUsername"))
    .replace("async function getPlatformAdmins", "export async function getPlatformAdmins");
  const normalizeBlock = beforePage
    .slice(beforePage.indexOf("function normalizeUsername"), beforePage.indexOf("async function createPlatformAdmin"))
    .replace("function normalizeUsername", "export function normalizeUsername");
  const actionsBlock = beforePage
    .slice(beforePage.indexOf("async function createPlatformAdmin"), beforePage.indexOf("export default"))
    .replace(/\nasync function /g, "\nexport async function ");

  w(
    "src/app/(app)/platform/admins/_lib/constants.ts",
    `import { PlatformPermissionType } from "@prisma/client";\n\nexport ${constBlock.trim()}\n`,
  );
  w("src/app/(app)/platform/admins/_lib/helpers.ts", `${helpersBlock}\n${normalizeBlock}\n`);
  w(
    "src/app/(app)/platform/admins/_lib/types.ts",
    `import type { Prisma } from "@prisma/client";\n\nexport ${typesBlock.trim()}\n\nexport type AdminRecord = Prisma.UserGetPayload<{\n  select: typeof adminSelect;\n}>;\n`,
  );
  w(
    "src/app/(app)/platform/admins/_lib/queries.ts",
    `import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminSelect, type AdminRecord } from "./types";

${queryBlock}
`,
  );
  w(
    "src/app/(app)/platform/admins/_lib/actions.ts",
    `"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import {
  PlatformPermissionType,
  PlatformRole,
  UserStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ALL_PLATFORM_PERMISSIONS } from "./constants";
import { normalizeUsername } from "./helpers";

${actionsBlock}
`,
  );

  const uiFns = uiAfter
    .replace(/function formatRole/g, "export function formatRole")
    .replace(/async function createPlatformAdmin/g, "")
    .replace(/async function deletePlatformAdmin/g, "");

  const createStart = uiAfter.indexOf("function CreateAdminSection");
  const adminsCardStart = uiAfter.indexOf("function AdminsCard");
  const sharedUi = uiAfter.slice(0, createStart).replace(/\nfunction /g, "\nexport function ");
  const createSection = uiAfter
    .slice(createStart, adminsCardStart)
    .replace(/\nfunction CreateAdminSection/, "\nexport function CreateAdminSection")
    .replace(/action={createPlatformAdmin}/, 'action={createPlatformAdmin}');
  const listAndRest = uiAfter
    .slice(adminsCardStart)
    .replace(/\nfunction AdminsCard/, "\nexport function AdminsCard")
    .replace(/action={deletePlatformAdmin}/g, "action={deletePlatformAdmin}");

  w(
    "src/app/(app)/platform/admins/_components/admins-ui.tsx",
    `import { createPlatformAdmin, deletePlatformAdmin } from "../_lib/actions";
import { ALL_PLATFORM_PERMISSIONS } from "../_lib/constants";
import { formatDate } from "../_lib/helpers";
import type { AdminRecord } from "../_lib/types";
import { PlatformRole, UserStatus } from "@prisma/client";

${sharedUi}
`,
  );
  w(
    "src/app/(app)/platform/admins/_components/create-admin-section.tsx",
    `import { PlatformRole, UserStatus } from "@prisma/client";
import { createPlatformAdmin } from "../_lib/actions";
import { ALL_PLATFORM_PERMISSIONS } from "../_lib/constants";
import { Field, formatRole } from "./admins-ui";

${createSection.replace(/createPlatformAdmin/g, "createPlatformAdmin")}
`,
  );
  w(
    "src/app/(app)/platform/admins/_components/admins-list-section.tsx",
    `import { deletePlatformAdmin } from "../_lib/actions";
import { formatDate } from "../_lib/helpers";
import type { AdminRecord } from "../_lib/types";
import {
  AdminRow,
  AdminsCard,
  EmptyState,
  PermissionsSection,
} from "./admins-ui";

export function AdminsListSection({ admins }: { admins: AdminRecord[] }) {
  return <AdminsCard admins={admins} />;
}

export { AdminRow, EmptyState, PermissionsSection };
`,
  );
  w(
    "src/app/(app)/platform/admins/_components/admins-workspace.tsx",
    `import type { AdminRecord } from "../_lib/types";
import { AdminsListSection } from "./admins-list-section";
import { CreateAdminSection } from "./create-admin-section";
import { PageHeader } from "./admins-ui";

export type AdminsWorkspaceProps = {
  admins: AdminRecord[];
};

export function AdminsWorkspace({ admins }: AdminsWorkspaceProps) {
  return (
${jsx.replace("<PageHeader />", "<PageHeader />").replace("<CreateAdminSection />", "<CreateAdminSection />").replace("<AdminsCard admins={admins} />", "<AdminsListSection admins={admins} />")}
  );
}
`,
  );
  w(
    rel,
    `import { AdminsWorkspace } from "./_components/admins-workspace";
import { getPlatformAdmins } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function PlatformAdminsPage() {
  const admins = await getPlatformAdmins();

  return <AdminsWorkspace admins={admins} />;
}
`,
  );
  console.log("admins", w(rel, fs.readFileSync(path.join(root, rel), "utf8")));
}

// ─── MARKETING ────────────────────────────────────────────────────────────────
{
  const rel = "src/app/(app)/platform/marketing/page.tsx";
  const gpath = `/tmp/git-${rel.replace(/[\/\[\]]/g, "_")}`;
  const { pre, jsx, beforePage, imports } = extract(gpath, "PlatformMarketingPage");

  const helperFns = beforePage
    .slice(beforePage.indexOf("function toNumber"), beforePage.indexOf("async function loadPlatformMarketingData"))
    .replace(/\nfunction /g, "\nexport function ");
  const queryFn = beforePage
    .slice(beforePage.indexOf("async function loadPlatformMarketingData"), beforePage.indexOf("export default"))
    .replace("async function loadPlatformMarketingData", "export async function loadPlatformMarketingData");

  w(
    "src/app/(app)/platform/marketing/_lib/helpers.ts",
    `import { APP_PLANS } from "@/lib/billing/plans";

${helperFns}
`,
  );
  w(
    "src/app/(app)/platform/marketing/_lib/queries.ts",
    `import { isTransientDatabaseError } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";

${queryFn}
`,
  );

  const gitSrc = fs.readFileSync(gpath, "utf8");
  const uiBlock = gitSrc
    .slice(gitSrc.indexOf("function InfoTile"), gitSrc.indexOf("export default"))
    .replace(/\nfunction /g, "\nexport function ");
  w("src/app/(app)/platform/marketing/_components/marketing-ui.tsx", `${uiBlock}\n`);

  const derivedPre = pre
    .replace(/await requirePlatformRole[\s\S]*?\}\);\s*/, "")
    .replace(/await loadPlatformMarketingData\(\)/, "await loadPlatformMarketingData()");

  w(
    "src/app/(app)/platform/marketing/_components/marketing-workspace.tsx",
    `import { APP_PLANS } from "@/lib/billing/plans";
import {
  AdminLink,
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatCurrency,
  formatDateTime,
  toneForStatus,
} from "../../_components/control-plane";
import {
  AttributionForm,
  CreateMarketerForm,
  MarketerUpdateForm,
} from "../marketing-forms";
import { estimateMonthlyCommission, formatPercent, toNumber } from "../_lib/helpers";
import type { loadPlatformMarketingData } from "../_lib/queries";
import { EmptyState, InfoTile } from "./marketing-ui";

export type MarketingWorkspaceProps = {
  degraded: boolean;
  marketers: Awaited<ReturnType<typeof loadPlatformMarketingData>>["marketers"];
  leads: Awaited<ReturnType<typeof loadPlatformMarketingData>>["leads"];
  organizations: Awaited<ReturnType<typeof loadPlatformMarketingData>>["organizations"];
  unassignedLeads: number;
  unassignedOrgs: number;
  activeMarketers: Awaited<ReturnType<typeof loadPlatformMarketingData>>["marketers"];
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
  } = props;

  return (
${jsx}
  );
}
`,
  );

  splitWorkspace(
    "src/app/(app)/platform/marketing/_components/marketing-workspace.tsx",
    '      <Surface title="Recent leads">',
    "MarketingMarketersSection",
    "MarketingLeadsOrgsSection",
  );

  w(
    rel,
    `import { requirePlatformRole } from "@/lib/permissions/guards";
import { estimateMonthlyCommission } from "./_lib/helpers";
import { loadPlatformMarketingData } from "./_lib/queries";
import { MarketingWorkspace } from "./_components/marketing-workspace";

export const dynamic = "force-dynamic";

export default async function PlatformMarketingPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

${derivedPre}

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
  console.log("marketing");
}

// ─── ORG SLUG ─────────────────────────────────────────────────────────────────
{
  const rel = "src/app/(app)/platform/organizations/[slug]/page.tsx";
  const gpath = `/tmp/git-${rel.replace(/[\/\[\]]/g, "_")}`;
  const { pre, jsx, beforePage } = extract(gpath, "PlatformOrganizationDetailPage");

  const helperFns = beforePage
    .slice(beforePage.indexOf("function formatDate"), beforePage.indexOf("type PageProps"))
    .replace(/\nfunction /g, "\nexport function ");
  const typesBlock = beforePage.slice(beforePage.indexOf("type PageProps"), beforePage.indexOf("export default"));

  w("src/app/(app)/platform/organizations/[slug]/_lib/helpers.ts", `${helperFns}\n`);
  w("src/app/(app)/platform/organizations/[slug]/_lib/types.ts", `export ${typesBlock.trim()}\n`);

  const queryBody = pre
    .replace(/params,\s*searchParams,\s*\}: PageProps\) \{[\s\S]*?await requirePlatformRole[\s\S]*?\}\);\s*/, "")
    .replace(/const \{ slug \} = await params;\s*/, "  const { slug } = slugParam;\n")
    .replace(/const statusParams = await searchParams;\s*/, "  const statusParams = searchParamsValue;\n");

  w(
    "src/app/(app)/platform/organizations/[slug]/_lib/queries.ts",
    `import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { jsonKeys } from "./helpers";

export async function getOrganizationDetailData(
  slugParam: { slug: string },
  searchParamsValue: { deleteError?: string; archiveError?: string } | undefined,
) {
${queryBody}
  return {
    org,
    statusParams,
    featureKeys,
    paidTotal,
    unitCount,
    recentPayments,
    recentMembers,
    recentAuditLogs,
    recentMessages,
  };
}
`,
  );

  const gitSrc = fs.readFileSync(gpath, "utf8");
  const uiBlock = gitSrc
    .slice(gitSrc.indexOf("function InfoTile"), gitSrc.length)
    .replace(/\nfunction /g, "\nexport function ");
  w(
    "src/app/(app)/platform/organizations/[slug]/_components/org-detail-ui.tsx",
    `${uiBlock}
`,
  );

  w(
    "src/app/(app)/platform/organizations/[slug]/_components/org-detail-workspace.tsx",
    `import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  FileText,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  archiveOrganizationAction,
  permanentlyDeleteOrganizationAction,
} from "../actions";
import {
  Badge,
  PageHeader,
  StatCard,
  Surface,
  formatCurrency,
  formatDateTime,
  formatNumber,
  labelize,
  toneForStatus,
} from "../../../_components/control-plane";
import { formatDate } from "../_lib/helpers";
import type { getOrganizationDetailData } from "../_lib/queries";
import { InfoTile, SmallCount } from "./org-detail-ui";

export type OrgDetailWorkspaceProps = Awaited<ReturnType<typeof getOrganizationDetailData>>;

export function OrgDetailWorkspace(props: OrgDetailWorkspaceProps) {
  const {
    org,
    statusParams,
    featureKeys,
    paidTotal,
    unitCount,
    recentPayments,
    recentMembers,
    recentAuditLogs,
    recentMessages,
  } = props;

  return (
${jsx}
  );
}
`,
  );

  splitWorkspace(
    "src/app/(app)/platform/organizations/[slug]/_components/org-detail-workspace.tsx",
    '      <section className="grid gap-4 xl:grid-cols-2">',
    "OrgDetailOverviewSection",
    "OrgDetailActivitySection",
  );

  w(
    rel,
    `import { requirePlatformRole } from "@/lib/permissions/guards";
import { OrgDetailWorkspace } from "./_components/org-detail-workspace";
import { getOrganizationDetailData } from "./_lib/queries";
import type { PageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function PlatformOrganizationDetailPage({
  params,
  searchParams,
}: PageProps) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const { slug } = await params;
  const statusParams = await searchParams;
  const data = await getOrganizationDetailData({ slug }, statusParams);

  return <OrgDetailWorkspace {...data} />;
}
`,
  );
  console.log("org-slug");
}

// ─── MOVE-OUTS ────────────────────────────────────────────────────────────────
{
  const rel = "src/app/(app)/move-outs/page.tsx";
  const gpath = `/tmp/git-${rel.replace(/[\/\[\]]/g, "_")}`;
  const { pre, jsx, beforePage } = extract(gpath, "MoveOutsPage");

  const helperFns = beforePage
    .slice(beforePage.indexOf("function formatDate"), beforePage.indexOf("async function scheduleInspectionAction"))
    .replace(/\nfunction /g, "\nexport function ");
  const actionsBlock = beforePage
    .slice(beforePage.indexOf("async function scheduleInspectionAction"), beforePage.indexOf("export default"))
    .replace(/\nasync function /g, "\nexport async function ");

  w("src/app/(app)/move-outs/_lib/helpers.ts", `${helperFns}\n`);
  w(
    "src/app/(app)/move-outs/_lib/actions.ts",
    `"use server";

import { revalidatePath } from "next/cache";
import { OrgRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { recordVacatedTenancy } from "@/lib/tenants/identity";
import { notifyInAppAndPush } from "@/lib/notifications/notify";

${actionsBlock}
`,
  );

  const queryBody = pre
    .replace(/const session = await requireManagementAccess\(\);\s*/, "")
    .trim();

  w(
    "src/app/(app)/move-outs/_lib/queries.ts",
    `import { OrgRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionWithScope } from "./types";

export async function getMoveOutsPageData(session: SessionWithScope) {
  ${queryBody}
  return {
    session,
    notices,
    inspectors,
    totalNotices,
    submittedCount,
    scheduledCount,
    completedCount,
    closedCount,
  };
}
`,
  );
  w(
    "src/app/(app)/move-outs/_lib/types.ts",
    `import type { requireManagementAccess } from "@/lib/permissions/guards";

export type SessionWithScope = Awaited<ReturnType<typeof requireManagementAccess>>;
`,
  );

  w(
    "src/app/(app)/move-outs/_components/move-outs-workspace.tsx",
    `import Link from "next/link";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { encodePublicId } from "@/lib/public-id";
import { closeMoveOutAction, scheduleInspectionAction } from "../_lib/actions";
import { formatDate, formatDateTime } from "../_lib/helpers";
import type { getMoveOutsPageData } from "../_lib/queries";

export type MoveOutsWorkspaceProps = Awaited<ReturnType<typeof getMoveOutsPageData>>;

export function MoveOutsWorkspace(props: MoveOutsWorkspaceProps) {
  const {
    session,
    notices,
    inspectors,
    totalNotices,
    submittedCount,
    scheduledCount,
    completedCount,
    closedCount,
  } = props;

  return (
${jsx}
  );
}
`,
  );

  splitWorkspace(
    "src/app/(app)/move-outs/_components/move-outs-workspace.tsx",
    '      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">',
    "MoveOutsHeaderSection",
    "MoveOutsTableSection",
  );

  w(
    rel,
    `import { requireManagementAccess } from "@/lib/permissions/guards";
import { MoveOutsWorkspace } from "./_components/move-outs-workspace";
import { getMoveOutsPageData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function MoveOutsPage() {
  const session = await requireManagementAccess();
  const data = await getMoveOutsPageData(session);

  return <MoveOutsWorkspace {...data} />;
}
`,
  );
  console.log("move-outs");
}

// ─── STAFF MEMBER DETAIL ──────────────────────────────────────────────────────
{
  const rel = "src/app/(app)/staff/[role]/[membershipId]/page.tsx";
  const gpath = `/tmp/git-${rel.replace(/[\/\[\]]/g, "_")}`;
  const { pre, jsx, beforePage } = extract(gpath, "MemberDetailPage");

  const helperFns = beforePage
    .slice(beforePage.indexOf("function formatDate"), beforePage.indexOf("type Props"))
    .replace(/\nfunction /g, "\nexport function ");
  const typesBlock = beforePage.slice(beforePage.indexOf("type Props"), beforePage.indexOf("export default"));

  w(`src/app/(app)/staff/[role]/[membershipId]/_lib/helpers.ts`, `${helperFns}\n`);
  w(`src/app/(app)/staff/[role]/[membershipId]/_lib/types.ts`, `export ${typesBlock.trim()}\n`);

  const queryBody = pre
    .replace(/params \}: Props\) \{[\s\S]*?const \{ role, membershipId \} = await params;\s*/, "  roleParam: string;\n  membershipId: string;\n}) {\n  const role = roleParam;\n  const membershipId = membershipIdParam;\n")
    .replace(/const orgId = await requireCurrentOrgId\(\);\s*/, "");

  w(
    "src/app/(app)/staff/[role]/[membershipId]/_lib/queries.ts",
    `import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeStaffRole } from "@/features/staff/constants/role-meta";

export async function getMemberDetailData(
  orgId: string,
  roleParam: string,
  membershipIdParam: string,
) {
  const role = roleParam;
  const membershipId = membershipIdParam;
  const normalizedRole = normalizeStaffRole(role);

  if (!normalizedRole) notFound();

${queryBody.replace(/^const \{ role, membershipId \} = await params;\s*/, "").replace(/^const orgId = await requireCurrentOrgId\(\);\s*/, "").replace(/^const normalizedRole[\s\S]*?if \(!normalizedRole\) notFound\(\);\s*/, "")}
  return { member, caretakerAssignments, normalizedRole, meta };
}
`,
  );

  const gitSrc = fs.readFileSync(gpath, "utf8");
  const uiBlock = gitSrc
    .slice(gitSrc.indexOf("function InfoCard"), gitSrc.length)
    .replace(/\nfunction /g, "\nexport function ");
  w(
    "src/app/(app)/staff/[role]/[membershipId]/_components/member-detail-ui.tsx",
    `${uiBlock}\n`,
  );

  w(
    "src/app/(app)/staff/[role]/[membershipId]/_components/member-detail-workspace.tsx",
    `import Link from "next/link";
import { deactivateMembershipAction } from "@/features/staff/actions/deactivate-membership";
import { endCaretakerAssignment } from "@/features/staff/actions/create-caretaker-assignment";
import { ROLE_META } from "@/features/staff/constants/role-meta";
import { formatDate, formatDateTime } from "../_lib/helpers";
import type { getMemberDetailData } from "../_lib/queries";
import {
  CredentialCard,
  DetailCard,
  InfoCard,
  StatusPill,
} from "./member-detail-ui";

export type MemberDetailWorkspaceProps = Awaited<ReturnType<typeof getMemberDetailData>>;

export function MemberDetailWorkspace(props: MemberDetailWorkspaceProps) {
  const { member, caretakerAssignments, normalizedRole, meta } = props;

  return (
${jsx}
  );
}
`,
  );

  splitWorkspace(
    "src/app/(app)/staff/[role]/[membershipId]/_components/member-detail-workspace.tsx",
    '      {normalizedRole === "CARETAKER" ? (',
    "MemberDetailProfileSection",
    "MemberCaretakerSection",
  );

  w(
    rel,
    `import { requireCurrentOrgId } from "@/lib/auth/org";
import { MemberDetailWorkspace } from "./_components/member-detail-workspace";
import { getMemberDetailData } from "./_lib/queries";
import type { Props } from "./_lib/types";

export default async function MemberDetailPage({ params }: Props) {
  const { role, membershipId } = await params;
  const orgId = await requireCurrentOrgId();
  const data = await getMemberDetailData(orgId, role, membershipId);

  return <MemberDetailWorkspace {...data} />;
}
`,
  );
  console.log("member-detail");
}

// ─── NEW ORGANIZATION (client) ────────────────────────────────────────────────
{
  const rel = "src/app/(app)/platform/organizations/new/page.tsx";
  const src = git(rel);

  const constBlock = src.slice(
    src.indexOf("const initialState"),
    src.indexOf("export default function NewOrganizationPage"),
  );
  const uiBlock = src
    .slice(src.indexOf("function Field"), src.length)
    .replace(/\nfunction /g, "\nexport function ");

  w("src/app/(app)/platform/organizations/new/_lib/constants.ts", `${constBlock}\n`);
  w("src/app/(app)/platform/organizations/new/_components/new-org-ui.tsx", `"use client";\n\n${uiBlock}\n`);

  const mainBody = src.slice(
    src.indexOf("export default function NewOrganizationPage"),
    src.indexOf("function Field"),
  );
  const fnBody = mainBody
    .replace("export default function NewOrganizationPage", "export function NewOrganizationWorkspace")
    .replace(
      /^import[\s\S]*?"use client";\n\n/,
      "",
    );

  w(
    "src/app/(app)/platform/organizations/new/_components/new-org-workspace.tsx",
    `"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User2,
} from "lucide-react";
import { CurrencySelect } from "@/components/forms/currency-select";
import {
  createOrganizationAction,
  type CreateOrganizationState,
} from "../actions";
import {
  fieldClass,
  helperTextClass,
  iconBubbleClass,
  iconClass,
  iconFieldClass,
  initialState,
  pageClass,
  panelClass,
  steps,
} from "../_lib/constants";
import { Field, ReviewCard } from "./new-org-ui";

${fnBody}
`,
  );

  // Split steps in workspace
  const wsPath = "src/app/(app)/platform/organizations/new/_components/new-org-workspace.tsx";
  splitWorkspace(wsPath, "          {step === 2 ? (", "NewOrgStepOne", "NewOrgStepsTwoThree");

  w(
    rel,
    `import { NewOrganizationWorkspace } from "./_components/new-org-workspace";

export default function NewOrganizationPage() {
  return <NewOrganizationWorkspace />;
}
`,
  );
  console.log("new-org");
}

console.log("batch remaining complete");