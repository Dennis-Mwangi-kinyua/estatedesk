import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

describe("PWA badge API", () => {
  it("exposes a soft-auth badge-count route backed by unread-count helpers", () => {
    const route = readFileSync(
      resolve(process.cwd(), "apps/web/src/app/api/pwa/badge-count/route.ts"),
      "utf8",
    );
    const unreadCount = readFileSync(
      resolve(process.cwd(), "services/notifications/src/lib/unread-count.ts"),
      "utf8",
    );
    const badgeSync = readFileSync(
      resolve(process.cwd(), "apps/web/src/components/pwa/pwa-app-badge-sync.tsx"),
      "utf8",
    );
    const proxy = readFileSync(
      resolve(process.cwd(), "apps/web/proxy.ts"),
      "utf8",
    );
    const appLayout = readFileSync(
      resolve(process.cwd(), "apps/web/src/app/(app)/layout.tsx"),
      "utf8",
    );
    const rootLayout = readFileSync(
      resolve(process.cwd(), "apps/web/src/app/layout.tsx"),
      "utf8",
    );

    assert.match(route, /resolveUnreadBadgeCount/);
    assert.match(route, /count:\s*0/);
    assert.doesNotMatch(route, /status:\s*401/);
    assert.match(unreadCount, /unread-count-query/);
    assert.match(badgeSync, /usePathname/);
    assert.match(badgeSync, /\/api\/pwa\/badge-count/);
    assert.match(proxy, /\/api\/pwa\/badge-count/);
    assert.match(appLayout, /PwaAppBadgeSync/);
    assert.doesNotMatch(rootLayout, /PwaAppBadgeSync/);
  });
});