import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

describe("PWA badge API", () => {
  it("exposes an authenticated badge-count route backed by unread-count helpers", () => {
    const route = readFileSync(
      resolve(process.cwd(), "src/app/api/pwa/badge-count/route.ts"),
      "utf8",
    );
    const unreadCount = readFileSync(
      resolve(process.cwd(), "src/lib/notifications/unread-count.ts"),
      "utf8",
    );
    const badgeSync = readFileSync(
      resolve(process.cwd(), "src/components/pwa/pwa-app-badge-sync.tsx"),
      "utf8",
    );

    assert.match(route, /resolveUnreadBadgeCount/);
    assert.match(route, /Unauthorized/);
    assert.match(unreadCount, /unread-count-query/);
    assert.match(badgeSync, /usePathname/);
    assert.match(badgeSync, /\/api\/pwa\/badge-count/);
  });
});