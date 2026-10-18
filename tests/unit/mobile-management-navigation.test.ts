import test from "node:test";
import assert from "node:assert/strict";
import { adminNavItems, developerNavItems } from "../../apps/web/src/app/(app)/platform/_lib/nav";
import { linksForManagementMode } from "../../apps/mobile/src/management-navigation";

const all = [...new Map([...adminNavItems, ...developerNavItems].map(item => [item.href, item])).values()].map(item => ({
  title: item.label, path: item.href, emoji: "", description: "", group: "Tools",
}));
for (const [mode, expected] of [["admin", adminNavItems], ["developer", developerNavItems]] as const) {
  test(`native ${mode} destinations match the web mode`, () => {
    assert.deepEqual(linksForManagementMode(all, mode).map(item => item.path).sort(), expected.map(item => item.href).sort());
  });
  test(`${mode} mode never adds destinations absent from the authorized menu`, () => {
    const permitted = all.filter(item => item.path !== "/platform/control");
    assert.ok(!linksForManagementMode(permitted, mode).some(item => item.path === "/platform/control"));
  });
}
test("organization navigation preserves every authorized entry", () => {
  assert.equal(linksForManagementMode(all, "organization"), all);
});
