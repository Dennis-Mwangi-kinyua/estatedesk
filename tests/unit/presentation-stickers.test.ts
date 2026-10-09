import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { stickerFor } from "../../apps/web/src/lib/presentation/stickers";
import { workspaceHeadingIcon } from "../../apps/web/src/components/shared/workspace-heading-icons";

test("distinct jobs have distinct icons, regardless of the parent workspace", () => {
  const cases = {
    "/dashboard/tenant": "House", "/dashboard/org": "House", "/platform": "House",
    "/dashboard/tenant/profile": "UserRound", "Tenant profile": "UserRound",
    "/dashboard/org/staff": "UsersRound", "/platform/users": "UsersRound",
    "/dashboard/org/inspections": "ClipboardCheck", "Maintenance": "Wrench",
    "/dashboard/tenant/invoice": "ReceiptText", "/dashboard/tenant/payments": "WalletCards",
    "/dashboard/tenant/lease": "FileCheck2", "/dashboard/tenant/documents": "Files",
    "/dashboard/tenant/notices": "Megaphone", "/dashboard/tenant/notifications": "BellRing",
    "/platform/permissions": "KeyRound", "/platform/admins": "ShieldUser",
    "/dashboard/org/accounting/requests": "Wallet", "/dashboard/org/accounting/reports": "ChartNoAxesCombined",
    "/dashboard/org/airbnb": "BedDouble", "/dashboard/caretaker/water-bills/read": "Droplets",
    "/platform/developer/docs": "BookOpen", "/platform/api-keys": "Braces",
    "/dashboard/org/properties/record-abc/edit": "Building2", "/dashboard/landlord#tenants": "ContactRound",
    "Phone": "Phone", "Email": "Mail", "National ID": "UserRound", "KRA PIN": "Landmark",
    "Other organisations": "Globe", "Property profile": "Building2",
  };
  for (const [label, icon] of Object.entries(cases)) {
    assert.equal(stickerFor(label).icon, icon, label);
    assert.deepEqual(stickerFor(label), stickerFor(label.toUpperCase()));
    const heading = workspaceHeadingIcon(label);
    assert.equal(heading.name, icon);
    assert.ok(heading.mask.startsWith('url("data:image/svg+xml,'), label);
  }
});

test("every published workspace navigation destination has an assigned semantic icon", () => {
  for (const file of ["components/layout/org-sidebar-links.ts", "components/layout/tenant-sidebar-links.ts", "app/(app)/platform/_lib/nav.ts", "app/(app)/dashboard/caretaker/_lib/i18n.ts"]) {
    const source = readFileSync(`apps/web/src/${file}`, "utf8");
    for (const [, href] of source.matchAll(/href: "([^"]+)"/g)) {
      assert.notEqual(stickerFor(href).icon, "LayoutDashboard", href);
      if (!/^\/(platform|dashboard\/(org|tenant|caretaker|landlord))$/.test(href)) {
        assert.notEqual(stickerFor(href).icon, "House", href);
      }
    }
  }
});
