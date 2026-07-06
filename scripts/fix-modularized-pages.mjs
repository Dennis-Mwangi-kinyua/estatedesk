import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");

function w(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function rm(rel) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

function readTmp(name) {
  return fs
    .readFileSync(`/tmp/${name}`, "utf8")
    .trim()
    .replace(/^\(\s*/, "")
    .replace(/\s*$/, "");
}

function gitShow(rel) {
  try {
    return execSync(`git show 'HEAD:${rel}'`, { cwd: root, encoding: "utf8" });
  } catch {
    return fs.readFileSync(path.join(root, rel), "utf8");
  }
}

// Marketing sections
{
  const jsx = readTmp("split-marketing/jsx.txt");
  const split = jsx.indexOf('      <Surface title="Recent leads">');
  const imports = `import {
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
import type { MarketingWorkspaceProps } from "./marketing-workspace";
import { EmptyState, InfoTile } from "./marketing-ui";`;

  w(
    "src/app/(app)/platform/marketing/_components/marketing-marketers-section.tsx",
    `${imports}

export function MarketingMarketersSection(props: MarketingWorkspaceProps) {
  const {
    degraded,
    marketers,
    activeMarketers,
    attributedLeads,
    attributedOrgs,
    unassignedLeads,
    unassignedOrgs,
    estimatedMonthlyCommission,
  } = props;

  return (
${jsx.slice(0, split)}
  );
}
`,
  );

  w(
    "src/app/(app)/platform/marketing/_components/marketing-leads-orgs-section.tsx",
    `${imports}

export function MarketingLeadsOrgsSection(props: MarketingWorkspaceProps) {
  const { leads, organizations, marketerOptions } = props;

  return (
    <>
${jsx.slice(split)}
    </>
  );
}
`,
  );
}

// Org detail sections
{
  const jsx = readTmp("split-org-slug/jsx.txt");
  const split = jsx.indexOf('      <section className="grid gap-4 xl:grid-cols-2">');
  const imports = `import Link from "next/link";
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
import type { OrgDetailWorkspaceProps } from "./org-detail-workspace";
import { InfoTile, SmallCount } from "./org-detail-ui";`;

  w(
    "src/app/(app)/platform/organizations/[slug]/_components/org-detail-overview-section.tsx",
    `${imports}

export function OrgDetailOverviewSection(props: OrgDetailWorkspaceProps) {
  const { org, featureKeys, paidTotal, unitCount, recentMessages } = props;

  return (
${jsx.slice(0, split)}
  );
}
`,
  );

  w(
    "src/app/(app)/platform/organizations/[slug]/_components/org-detail-activity-section.tsx",
    `${imports}

export function OrgDetailActivitySection(props: OrgDetailWorkspaceProps) {
  const { org, statusParams, recentPayments, recentMembers, recentAuditLogs } = props;

  return (
    <>
${jsx.slice(split)}
    </>
  );
}
`,
  );
}

// Move-outs single workspace (with guide hints from working tree)
{
  let jsx = readTmp("split-move-outs/jsx.txt");
  jsx = jsx.replace(
    `<p className="mt-2 text-sm text-muted-foreground">
            Track tenant move-out notices and inspections.
          </p>`,
    `<p className="mt-2 text-sm text-muted-foreground">
            Track tenant move-out notices and inspections.
          </p>
          <InAppGuideHint
            topic="moveOut"
            workspace="org"
            orgRole={session.activeOrgRole}
          />`,
  );
  jsx = jsx.replace(
    `<div className="p-8 text-center text-sm text-muted-foreground">
            No move-out notices found.
          </div>`,
    `<div className="p-8 text-center text-sm text-muted-foreground">
            <p>No move-out notices found.</p>
            <div className="mt-4 flex justify-center">
              <InAppGuideLink
                topic="moveOut"
                workspace="org"
                orgRole={session.activeOrgRole}
                variant="card"
              />
            </div>
          </div>`,
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
  rm("src/app/(app)/move-outs/_components/move-outs-header-section.tsx");
  rm("src/app/(app)/move-outs/_components/move-outs-table-section.tsx");
}

// Staff member sections
{
  const jsx = readTmp("split-member-detail/jsx.txt");
  const split = jsx.indexOf('      {normalizedRole === "CARETAKER" ? (');
  const imports = `import Link from "next/link";
import { deactivateMembershipAction } from "@/features/staff/actions/deactivate-membership";
import { endCaretakerAssignment } from "@/features/staff/actions/create-caretaker-assignment";
import { formatDate, formatDateTime } from "../_lib/helpers";
import type { MemberDetailWorkspaceProps } from "./member-detail-workspace";
import {
  CredentialCard,
  DetailCard,
  InfoCard,
  StatusPill,
} from "./member-detail-ui";`;

  w(
    "src/app/(app)/staff/[role]/[membershipId]/_components/member-detail-profile-section.tsx",
    `${imports}

export function MemberDetailProfileSection(props: MemberDetailWorkspaceProps) {
  const { member, normalizedRole, meta } = props;

  return (
${jsx.slice(0, split)}
  );
}
`,
  );

  w(
    "src/app/(app)/staff/[role]/[membershipId]/_components/member-detail-caretaker-section.tsx",
    `${imports}

export function MemberCaretakerSection(props: MemberDetailWorkspaceProps) {
  const { member, caretakerAssignments, normalizedRole } = props;

  return (
    <>
${jsx.slice(split)}
    </>
  );
}
`,
  );

  w(
    "src/app/(app)/staff/[role]/[membershipId]/_components/member-detail-workspace.tsx",
    `import type { getMemberDetailData } from "../_lib/queries";
import { MemberCaretakerSection } from "./member-detail-caretaker-section";
import { MemberDetailProfileSection } from "./member-detail-profile-section";

export type MemberDetailWorkspaceProps = Awaited<ReturnType<typeof getMemberDetailData>>;

export function MemberDetailWorkspace(props: MemberDetailWorkspaceProps) {
  return (
    <>
      <MemberDetailProfileSection {...props} />
      <MemberCaretakerSection {...props} />
    </>
  );
}
`,
  );
}

// New organization client workspace
{
  const src = gitShow("src/app/(app)/platform/organizations/new/page.tsx");
  const fieldIdx = src.indexOf("\nfunction Field");
  const main = src.slice(0, fieldIdx);
  const ui = src.slice(fieldIdx + 1).replace(/\nfunction /g, "\nexport function ");

  w(
    "src/app/(app)/platform/organizations/new/_components/new-org-ui.tsx",
    `"use client";

${ui}
`,
  );

  w(
    "src/app/(app)/platform/organizations/new/_components/new-org-workspace.tsx",
    `"use client";

${main
  .replace(/^"use client";\n\n/, "")
  .replace('from "./actions"', 'from "../actions"')
  .replace("export default function NewOrganizationPage", "export function NewOrganizationWorkspace")
  .replace(
    'import { CurrencySelect } from "@/components/forms/currency-select";',
    'import { CurrencySelect } from "@/components/forms/currency-select";\nimport { Field, ReviewCard } from "./new-org-ui";',
  )}
`,
  );

  rm("src/app/(app)/platform/organizations/new/_components/new-org-step-one.tsx");
  rm("src/app/(app)/platform/organizations/new/_components/new-org-steps-two-three.tsx");
}

console.log("fixed");