import assert from "node:assert/strict";
import test from "node:test";
import { slugifyTenantName } from "../../apps/web/src/lib/tenants/slug";
import { getCaretakerTenantHref } from "../../apps/web/src/app/(app)/dashboard/caretaker/_lib/paths";

test("slugifyTenantName builds readable slugs", () => {
  assert.equal(slugifyTenantName("Faith Wanjiku"), "faith-wanjiku");
  assert.equal(slugifyTenantName("  Jane   Doe  "), "jane-doe");
  assert.equal(slugifyTenantName("O'Brien & Sons"), "o-brien-sons");
});

test("caretaker tenant href prefers slug over encoded id", () => {
  assert.equal(
    getCaretakerTenantHref({ id: "clxyz123", slug: "faith-wanjiku" }),
    "/dashboard/caretaker/tenants/faith-wanjiku",
  );
  assert.match(
    getCaretakerTenantHref({ id: "clxyz123", slug: null }),
    /^\/dashboard\/caretaker\/tenants\/ed_/,
  );
});
