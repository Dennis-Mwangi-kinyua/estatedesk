import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, it } from "node:test";
import manifest from "../../apps/web/src/app/manifest";

const originalAppUrl = process.env.APP_URL;
const originalPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (originalAppUrl === undefined) {
    delete process.env.APP_URL;
  } else {
    process.env.APP_URL = originalAppUrl;
  }

  if (originalPublicAppUrl === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = originalPublicAppUrl;
  }
});

describe("PWA manifest", () => {
  it("includes installability essentials and richer display metadata", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://estatedesk.co.ke";

    const config = manifest();

    assert.equal(config.display, "standalone");
    assert.deepEqual(config.display_override, ["standalone", "minimal-ui", "browser"]);
    assert.equal(config.prefer_related_applications, false);
    assert.equal(config.id, "/");
    assert.equal(config.start_url, "/dashboard");
    assert.equal(config.orientation, "any");
    assert.deepEqual(config.launch_handler, { client_mode: "navigate-existing" });
    assert.equal(config.share_target?.action, "/share");
    assert.equal(
      config.share_target?.enctype,
      "application/x-www-form-urlencoded",
    );

    const iconSizes = (config.icons ?? []).map((icon) => icon.sizes);
    assert.ok(iconSizes.includes("144x144"));
    assert.ok(iconSizes.includes("192x192"));
    assert.ok(iconSizes.includes("512x512"));

    const purposes = (config.icons ?? []).map((icon) => icon.purpose);
    assert.ok(purposes.includes("any"));
    assert.ok(purposes.includes("maskable"));
  });
});

describe("service worker", () => {
  it("precaches offline fallbacks and uses resilient install logic", () => {
    const serviceWorker = readFileSync(
      resolve(process.cwd(), "apps/web/public/sw.js"),
      "utf8",
    );

    assert.match(serviceWorker, /estatedesk-pwa-v5/);
    assert.match(serviceWorker, /requestBadgeSync/);
    assert.match(serviceWorker, /SYNC_APP_BADGE/);
    assert.match(serviceWorker, /\/offline-shell\.html/);
    assert.match(serviceWorker, /Promise\.allSettled/);
    assert.match(serviceWorker, /openOrFocusClient/);
    assert.match(serviceWorker, /action: "open", title: "Open"/);
    assert.match(serviceWorker, /action: "dismiss", title: "Dismiss"/);
  });
});

describe("push test delivery", () => {
  it("exposes a server helper and API route for test alerts", () => {
    const helper = readFileSync(
      resolve(process.cwd(), "apps/web/src/lib/push/send-test-push.ts"),
      "utf8",
    );
    const route = readFileSync(
      resolve(process.cwd(), "apps/web/src/app/api/push/test/route.ts"),
      "utf8",
    );

    assert.match(helper, /sendTestPushToUser/);
    assert.match(helper, /estatedesk-push-test/);
    assert.match(route, /sendTestPushToUser/);
    assert.match(route, /Unauthorized/);
  });
});