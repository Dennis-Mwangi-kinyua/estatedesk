import test from "node:test";
import assert from "node:assert/strict";
import { clearLogoutCache } from "../../apps/web/src/lib/auth/logout-cache";

test("logout deletes EstateDesk asset caches and navigation context but retains drafts and preferences", async () => {
  const deleted: string[] = [];
  const values = new Map([
    ["estatedesk.directory:org:/tenants", "private search"],
    ["organization-draft", "unsent work"],
    ["theme", "dark"],
  ]);
  const browser = {
    caches: { keys: async () => ["estatedesk-pwa-old-static", "estatedesk-pwa-current-static", "other-app"], delete: async (key: string) => { deleted.push(key); return true; } },
    sessionStorage: { get length() { return values.size; }, key: (index: number) => [...values.keys()][index] ?? null, removeItem: (key: string) => { values.delete(key); } },
  } as unknown as Pick<Window, "caches" | "sessionStorage">;
  await clearLogoutCache(browser);
  assert.deepEqual(deleted, ["estatedesk-pwa-old-static", "estatedesk-pwa-current-static"]);
  assert.deepEqual([...values.keys()], ["organization-draft", "theme"]);
});

test("denied browser storage does not prevent other cleanup or completion", async () => {
  let deleted = false;
  const browser = {
    caches: { keys: async () => ["estatedesk-pwa-static"], delete: async () => { deleted = true; return true; } },
    get sessionStorage() { throw new Error("Storage denied"); },
  } as unknown as Pick<Window, "caches" | "sessionStorage">;
  await clearLogoutCache(browser);
  assert.equal(deleted, true);
  await clearLogoutCache({} as Pick<Window, "caches" | "sessionStorage">);
});

test("stalled cache APIs cannot hold logout open", async () => {
  const { clearLogoutCacheWithin } = await import("../../apps/web/src/lib/auth/logout-cache");
  const browser = {
    caches: { keys: () => new Promise(() => {}) },
    sessionStorage: { length: 0 },
  } as unknown as Pick<Window, "caches" | "sessionStorage">;
  await Promise.race([
    clearLogoutCacheWithin(browser, 10),
    new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error("Cache cleanup blocked logout")), 1000); timer.unref(); }),
  ]);
});
