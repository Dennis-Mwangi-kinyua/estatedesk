import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");

function readModule(...segments: string[]) {
  return readFileSync(join(ROOT, ...segments), "utf8");
}

describe("in-app guide wiring", () => {
  it("links protected dashboard screens to workspace-scoped help routes", () => {
    const moveOuts = readModule(
      "src/app/(app)/move-outs/_components/move-outs-workspace.tsx",
    );
    const orgPayments = readModule(
      "src/app/(app)/dashboard/org/payments/_components/payments-header.tsx",
    );
    const orgUnits = readModule(
      "src/app/(app)/dashboard/org/units/_components/units-header-section.tsx",
    );
    const tenantPayments = readModule(
      "src/app/(app)/dashboard/tenant/payments/_components/empty-state.tsx",
    );
    const orgSidebar = readModule(
      "src/components/layout/org-dashboard-sidebar.tsx",
    );
    const landlordShell = readModule(
      "src/components/layout/landlord-dashboard-shell.tsx",
    );
    const platformLayout = readModule(
      "src/app/(app)/platform/layout.tsx",
    );
    const tenantLease = readModule(
      "src/app/(app)/dashboard/tenant/lease/_components/lease-workspace.tsx",
    );
    const caretakerInspections = readModule(
      "src/app/(app)/dashboard/caretaker/inspections/_components/inspections-workspace.tsx",
    );
    const caretakerLeases = readModule(
      "src/app/(app)/dashboard/caretaker/leases/_components/leases-workspace.tsx",
    );
    const orgSettings = readModule(
      "src/app/(app)/dashboard/org/settings/_components/sections/api-keys-section.tsx",
    );

    assert.match(moveOuts, /workspace="org"/);
    assert.match(orgPayments, /workspace="org"/);
    assert.match(orgUnits, /workspace="org"/);
    assert.match(tenantPayments, /workspace="tenant"/);
    assert.match(orgSidebar, /workspace="org"/);
    assert.match(landlordShell, /workspace="landlord"/);
    assert.match(platformLayout, /workspace="platform"/);
    assert.match(tenantLease, /workspace="tenant"/);
    assert.match(caretakerInspections, /workspace="caretaker"/);
    assert.match(caretakerLeases, /workspace="caretaker"/);
    assert.match(orgSettings, /apiIntegrations/);
    assert.doesNotMatch(orgSidebar, /getGuideHubPath\(\)/);
  });

  it("ships protected help routes for each dashboard workspace", () => {
    const dashboardWorkspaces = ["org", "tenant", "caretaker", "landlord"] as const;

    for (const workspace of dashboardWorkspaces) {
      const hub = join(
        ROOT,
        `src/app/(app)/dashboard/${workspace}/help/page.tsx`,
      );
      const article = join(
        ROOT,
        `src/app/(app)/dashboard/${workspace}/help/[slug]/page.tsx`,
      );

      assert.match(readFileSync(hub, "utf8"), /InAppGuideHub/);
      assert.match(readFileSync(article, "utf8"), /getAccessibleInAppGuideArticle/);
    }

    const platformHub = join(ROOT, "src/app/(app)/platform/help/page.tsx");
    const platformArticle = join(
      ROOT,
      "src/app/(app)/platform/help/[slug]/page.tsx",
    );

    assert.match(readFileSync(platformHub, "utf8"), /InAppGuideHub/);
    assert.match(
      readFileSync(platformArticle, "utf8"),
      /getAccessibleInAppGuideArticle/,
    );
  });
});