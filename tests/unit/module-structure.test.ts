import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");

function assertModule(relativePath: string) {
  assert.ok(
    existsSync(join(ROOT, relativePath)),
    `expected module at ${relativePath}`,
  );
}

function assertMaxLines(relativePath: string, maxLines: number) {
  const content = readFileSync(join(ROOT, relativePath), "utf8");
  const lineCount = content.split("\n").length;
  assert.ok(
    lineCount <= maxLines,
    `expected ${relativePath} to be <= ${maxLines} lines (got ${lineCount})`,
  );
}

function assertThinPage(relativePath: string, maxLines = 80) {
  assertModule(relativePath);
  assertMaxLines(relativePath, maxLines);
}

type ModularRoute = {
  name: string;
  page: string;
  lib: string[];
  components: string[];
  maxPageLines?: number;
};

const MODULAR_ROUTES: ModularRoute[] = [
  {
    name: "tenant notices",
    page: "src/app/(app)/dashboard/tenant/notices/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["notices-header.tsx", "received-notices-card.tsx", "give-notice-card.tsx"],
    maxPageLines: 120,
  },
  {
    name: "tenant payments",
    page: "src/app/(app)/dashboard/tenant/payments/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["payments-header.tsx", "payments-stats.tsx", "ledger-card.tsx"],
    maxPageLines: 80,
  },
  {
    name: "tenant lease",
    page: "src/app/(app)/dashboard/tenant/lease/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: [
      "lease-workspace.tsx",
      "lease-header.tsx",
      "lease-stats.tsx",
      "active-lease-panel.tsx",
      "lease-history-section.tsx",
    ],
    maxPageLines: 40,
  },
  {
    name: "org notifications",
    page: "src/app/(app)/dashboard/org/notifications/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: [
      "notifications-workspace.tsx",
      "notifications-hero.tsx",
      "move-out-queue-panel.tsx",
      "water-approval-queue-panel.tsx",
      "communication-feed-panel.tsx",
      "operations-sidebar.tsx",
    ],
    maxPageLines: 40,
  },
  {
    name: "org issues",
    page: "src/app/(app)/dashboard/org/issues/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["issues-header.tsx", "issues-stats.tsx", "issues-stage-board.tsx"],
    maxPageLines: 150,
  },
  {
    name: "org tenants detail",
    page: "src/app/(app)/dashboard/org/tenants/[tenantId]/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["tenant-details-workspace.tsx", "tenant-details-main-column.tsx"],
    maxPageLines: 60,
  },
  {
    name: "org units",
    page: "src/app/(app)/dashboard/org/units/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["units-workspace.tsx", "units-header-section.tsx"],
    maxPageLines: 40,
  },
  {
    name: "org payments",
    page: "src/app/(app)/dashboard/org/payments/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["payments-workspace.tsx", "payments-header.tsx"],
    maxPageLines: 40,
  },
  {
    name: "caretaker issues",
    page: "src/app/(app)/dashboard/caretaker/issues/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts", "constants.ts"],
    components: [
      "issues-workspace.tsx",
      "issues-header.tsx",
      "issues-board.tsx",
      "issue-card.tsx",
    ],
    maxPageLines: 80,
  },
  {
    name: "caretaker dashboard",
    page: "src/app/(app)/dashboard/caretaker/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["caretaker-dashboard.tsx"],
    maxPageLines: 40,
  },
  {
    name: "landlord dashboard",
    page: "src/app/(app)/dashboard/landlord/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["landlord-dashboard.tsx"],
    maxPageLines: 40,
  },
  {
    name: "platform dashboard",
    page: "src/app/(app)/platform/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["platform-dashboard.tsx"],
    maxPageLines: 30,
  },
  {
    name: "platform users",
    page: "src/app/(app)/platform/users/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["users-workspace.tsx", "users-ui.tsx"],
    maxPageLines: 40,
  },
  {
    name: "staff directory",
    page: "src/app/(app)/staff/page.tsx",
    lib: ["queries.ts", "helpers.ts"],
    components: ["staff-workspace.tsx"],
    maxPageLines: 40,
  },
  {
    name: "move-outs",
    page: "src/app/(app)/move-outs/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["move-outs-workspace.tsx", "move-outs-pagination.tsx"],
    maxPageLines: 20,
  },
  {
    name: "buildings",
    page: "src/app/(app)/buildings/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["buildings-workspace.tsx"],
    maxPageLines: 30,
  },
  {
    name: "org leases",
    page: "src/app/(app)/dashboard/org/leases/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["leases-workspace.tsx", "leases-pagination.tsx"],
    maxPageLines: 30,
  },
  {
    name: "caretaker leases",
    page: "src/app/(app)/dashboard/caretaker/leases/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["leases-workspace.tsx"],
    maxPageLines: 35,
  },
  {
    name: "caretaker tenants",
    page: "src/app/(app)/dashboard/caretaker/tenants/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["tenants-workspace.tsx"],
    maxPageLines: 35,
  },
  {
    name: "caretaker notifications",
    page: "src/app/(app)/dashboard/caretaker/notifications/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["notifications-workspace.tsx"],
    maxPageLines: 35,
  },
  {
    name: "caretaker profile",
    page: "src/app/(app)/dashboard/caretaker/profile/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts", "constants.ts"],
    components: ["profile-workspace.tsx", "profile-header.tsx"],
    maxPageLines: 35,
  },
  {
    name: "caretaker security",
    page: "src/app/(app)/dashboard/caretaker/security/page.tsx",
    lib: ["queries.ts", "types.ts", "constants.ts"],
    components: ["security-workspace.tsx", "security-header.tsx"],
    maxPageLines: 20,
  },
  {
    name: "caretaker meter read",
    page: "src/app/(app)/dashboard/caretaker/water-bills/read/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts", "constants.ts"],
    components: ["read-workspace.tsx", "read-header.tsx"],
    maxPageLines: 25,
  },
  {
    name: "caretaker new issue",
    page: "src/app/(app)/dashboard/caretaker/issues/new/page.tsx",
    lib: ["constants.ts", "queries.ts"],
    components: ["new-issue-workspace.tsx"],
    maxPageLines: 50,
  },
  {
    name: "caretaker finance requests",
    page: "src/app/(app)/dashboard/caretaker/finance-requests/page.tsx",
    lib: ["constants.ts", "queries.ts"],
    components: ["caretaker-finance-workspace.tsx"],
    maxPageLines: 35,
  },
  {
    name: "caretaker water bills",
    page: "src/app/(app)/dashboard/caretaker/water-bills/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts", "constants.ts"],
    components: ["water-bills-workspace.tsx", "water-bills-header.tsx"],
    maxPageLines: 25,
  },
  {
    name: "caretaker inspections",
    page: "src/app/(app)/dashboard/caretaker/inspections/page.tsx",
    lib: ["queries.ts", "helpers.ts", "constants.ts"],
    components: ["inspections-workspace.tsx", "inspections-header.tsx"],
    maxPageLines: 35,
  },
  {
    name: "caretaker bill detail",
    page: "src/app/(app)/dashboard/caretaker/water-bills/bills/[billId]/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["bill-detail-workspace.tsx", "bill-detail-header.tsx"],
    maxPageLines: 35,
  },
  {
    name: "caretaker reading detail",
    page: "src/app/(app)/dashboard/caretaker/water-bills/readings/[readingId]/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["reading-detail-workspace.tsx", "reading-detail-header.tsx"],
    maxPageLines: 35,
  },
  {
    name: "caretaker meter entry",
    page: "src/app/(app)/dashboard/caretaker/water-bills/read/[unitId]/page.tsx",
    lib: ["queries.ts"],
    components: ["meter-entry-workspace.tsx", "meter-entry-header.tsx"],
    maxPageLines: 60,
  },
  {
    name: "caretaker help",
    page: "src/app/(app)/dashboard/caretaker/help/page.tsx",
    lib: [],
    components: ["help-workspace.tsx"],
    maxPageLines: 20,
  },
  {
    name: "caretaker today work",
    page: "src/app/(app)/dashboard/caretaker/today/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["today-workspace.tsx", "today-header.tsx"],
    maxPageLines: 20,
  },
  {
    name: "caretaker units",
    page: "src/app/(app)/dashboard/caretaker/units/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["units-workspace.tsx", "units-header.tsx"],
    maxPageLines: 25,
  },
  {
    name: "caretaker unit detail",
    page: "src/app/(app)/dashboard/caretaker/units/[unitId]/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["unit-detail-workspace.tsx", "unit-detail-header.tsx"],
    maxPageLines: 30,
  },
  {
    name: "caretaker search",
    page: "src/app/(app)/dashboard/caretaker/search/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["search-workspace.tsx", "search-header.tsx"],
    maxPageLines: 25,
  },
  {
    name: "caretaker calendar",
    page: "src/app/(app)/dashboard/caretaker/calendar/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["calendar-workspace.tsx", "calendar-header.tsx"],
    maxPageLines: 25,
  },
  {
    name: "caretaker documents",
    page: "src/app/(app)/dashboard/caretaker/documents/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["documents-workspace.tsx", "documents-header.tsx"],
    maxPageLines: 25,
  },
  {
    name: "caretaker broadcasts",
    page: "src/app/(app)/dashboard/caretaker/broadcasts/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["broadcasts-workspace.tsx", "broadcasts-header.tsx"],
    maxPageLines: 25,
  },
  {
    name: "caretaker handover",
    page: "src/app/(app)/dashboard/caretaker/handover/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["handover-workspace.tsx", "handover-form.tsx"],
    maxPageLines: 25,
  },
  {
    name: "caretaker vendors",
    page: "src/app/(app)/dashboard/caretaker/vendors/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["vendors-workspace.tsx", "vendors-header.tsx"],
    maxPageLines: 25,
  },
  {
    name: "caretaker move-outs",
    page: "src/app/(app)/dashboard/caretaker/move-outs/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["move-outs-workspace.tsx", "move-outs-header.tsx"],
    maxPageLines: 25,
  },
  {
    name: "caretaker issue detail",
    page: "src/app/(app)/dashboard/caretaker/issues/[issueId]/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["issue-detail-workspace.tsx", "issue-detail-header.tsx"],
    maxPageLines: 45,
  },
  {
    name: "caretaker tenant detail",
    page: "src/app/(app)/dashboard/caretaker/tenants/[tenantId]/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["tenant-detail-workspace.tsx", "tenant-detail-header.tsx"],
    maxPageLines: 35,
  },
  {
    name: "org expenditures",
    page: "src/app/(app)/dashboard/org/expenditures/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["expenditures-workspace.tsx", "expenditures-pagination.tsx"],
    maxPageLines: 25,
  },
  {
    name: "tenant expenditures",
    page: "src/app/(app)/dashboard/tenant/expenditures/page.tsx",
    lib: ["queries.ts", "helpers.ts", "types.ts"],
    components: ["expenditures-workspace.tsx"],
    maxPageLines: 25,
  },
];

const FEATURE_MODULES = [
  {
    name: "member form",
    orchestrator: "src/features/staff/components/member-form.tsx",
    lib: ["types.ts", "helpers.ts", "validation.ts"],
    maxLines: 300,
  },
  {
    name: "property create wizard",
    orchestrator: "src/features/properties/components/property-create-wizard.tsx",
    lib: ["types.ts", "helpers.ts", "validation.ts"],
    maxLines: 200,
  },
  {
    name: "new tenant form",
    orchestrator: "src/app/(app)/dashboard/org/tenants/new/new-tenant-form.tsx",
    lib: ["types.ts", "helpers.ts", "validation.ts"],
    maxLines: 250,
  },
  {
    name: "tenant profile view",
    orchestrator: "src/components/tenant/tenant-profile-view.tsx",
    lib: ["types.ts", "helpers.ts"],
    maxLines: 200,
  },
];

describe("modular page structure", () => {
  for (const route of MODULAR_ROUTES) {
    it(`keeps ${route.name} split into lib, components, and a thin page`, () => {
      const base = route.page.replace(/\/page\.tsx$/, "");

      assertThinPage(route.page, route.maxPageLines ?? 80);

      for (const file of route.lib) {
        assertModule(`${base}/_lib/${file}`);
      }

      for (const file of route.components) {
        assertModule(`${base}/_components/${file}`);
      }
    });
  }

  for (const feature of FEATURE_MODULES) {
    it(`keeps ${feature.name} split with a thin orchestrator`, () => {
      const base = feature.orchestrator.replace(/\/[^/]+\.tsx$/, "");
      assertModule(feature.orchestrator);
      assertMaxLines(feature.orchestrator, feature.maxLines);

      for (const file of feature.lib) {
        const libDir = feature.orchestrator.includes("/features/")
          ? `${base}/_lib/${file}`
          : `${base}/_lib/${file}`;
        assertModule(libDir);
      }
    });
  }

  it("keeps org notification panels under 300 lines each", () => {
    const panels = [
      "notifications-hero.tsx",
      "move-out-queue-panel.tsx",
      "water-approval-queue-panel.tsx",
      "communication-feed-panel.tsx",
      "operations-sidebar.tsx",
      "notifications-workspace.tsx",
    ];

    for (const panel of panels) {
      assertMaxLines(
        `src/app/(app)/dashboard/org/notifications/_components/${panel}`,
        300,
      );
    }
  });

  it("keeps printable issue work order route available", () => {
    assertModule("src/app/print/issues/[issueId]/page.tsx");
    assertMaxLines("src/app/print/issues/[issueId]/page.tsx", 220);
  });

  it("exposes shared formatter utilities", () => {
    assertModule("src/lib/formatters/datetime.ts");
    assertModule("src/lib/formatters/numbers.ts");
    assertModule("src/lib/formatters/labels.ts");
    assertModule("src/components/theme/ed-dashboard-shell.tsx");
  });
});