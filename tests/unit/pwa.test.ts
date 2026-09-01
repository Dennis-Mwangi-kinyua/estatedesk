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
    assert.equal(config.start_url, "/login?source=pwa");
    assert.equal(config.orientation, "any");
    assert.equal(config.background_color, "#f8fafc");
    assert.equal(config.theme_color, "#f8fafc");
    assert.deepEqual(config.launch_handler, { client_mode: "navigate-existing" });
    assert.equal(config.share_target?.action, "/share");
    assert.equal(
      config.share_target?.enctype,
      "application/x-www-form-urlencoded",
    );
    assert.ok(Array.isArray((config as { screenshots?: unknown[] }).screenshots));
    assert.ok(((config as { screenshots?: unknown[] }).screenshots?.length ?? 0) >= 1);

    const iconSizes = (config.icons ?? []).map((icon) => icon.sizes);
    assert.ok(iconSizes.includes("144x144"));
    assert.ok(iconSizes.includes("192x192"));
    assert.ok(iconSizes.includes("512x512"));

    const purposes = (config.icons ?? []).map((icon) => icon.purpose);
    assert.ok(purposes.includes("any"));
    assert.ok(purposes.includes("maskable"));
  });
});

describe("PWA launch screen", () => {
  it("detects standalone mode before paint and renders a loading overlay", () => {
    const layout = readFileSync(
      resolve(process.cwd(), "apps/web/src/app/layout.tsx"),
      "utf8",
    );
    const launchScreen = readFileSync(
      resolve(
        process.cwd(),
        "apps/web/src/components/pwa/pwa-launch-screen.tsx",
      ),
      "utf8",
    );

    assert.match(layout, /display-mode: standalone/);
    assert.match(layout, /dataset\.pwaLaunch="visible"/);
    assert.match(layout, /<PwaLaunchScreen \/>/);
    assert.match(launchScreen, /MINIMUM_VISIBLE_TIME_MS/);
    assert.match(launchScreen, /dataset\.pwaLaunch = "ready"/);
  });
});

describe("service worker", () => {
  it("precaches offline fallbacks and uses resilient install logic", () => {
    const serviceWorker = readFileSync(
      resolve(process.cwd(), "apps/web/public/sw.js"),
      "utf8",
    );

    assert.match(
      serviceWorker,
      /const CACHE_VERSION = "estatedesk-pwa-v\d+\.\d+\.\d+"/,
    );
    assert.match(serviceWorker, /requestBadgeSync/);
    assert.match(serviceWorker, /SYNC_APP_BADGE/);
    assert.match(serviceWorker, /SYNC_CARETAKER_OFFLINE_QUEUE/);
    assert.match(serviceWorker, /caretaker-offline-queue-sync/);
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
