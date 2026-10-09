import assert from "node:assert/strict";
import test from "node:test";
import { decodePublicId } from "../../apps/web/src/lib/public-id";
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
  const fallback = getCaretakerTenantHref({ id: "clxyz123", slug: null });
  assert.match(fallback, /^\/dashboard\/caretaker\/tenants\/tenant--ed_/);
  assert.equal(decodePublicId(fallback.split("/").at(-1)!, "tenant"), "clxyz123");
});
