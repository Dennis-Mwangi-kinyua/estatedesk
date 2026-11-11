import test from "node:test";
import assert from "node:assert/strict";
import { platformNavItems } from "../../apps/web/src/app/(app)/platform/_lib/nav";
import { linksForManagementMode } from "../../apps/mobile/src/management-navigation";

const all = platformNavItems.map(item => ({
  title: item.label, path: item.href, emoji: "", description: "", group: "Tools",
}));
for (const mode of ["admin", "developer"] as const) {
  test(`native ${mode} callers receive the unified catalogue`, () => {
    assert.deepEqual(linksForManagementMode(all, mode).map(item => item.path).sort(), platformNavItems.map(item => item.href).sort());
  });
  test(`${mode} mode never adds destinations absent from the authorized menu`, () => {
    const permitted = all.filter(item => item.path !== "/platform/control");
    assert.ok(!linksForManagementMode(permitted, mode).some(item => item.path === "/platform/control"));
  });
}
test("organization navigation preserves every authorized entry", () => {
  assert.equal(linksForManagementMode(all, "organization"), all);
});
