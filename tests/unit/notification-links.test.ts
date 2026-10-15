import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getDefaultNotificationActionUrl,
  readNotificationActionUrl,
  resolveNotificationActionUrl,
  resolveNotificationAudience,
} from "../../apps/web/src/lib/push/notification-links";

describe("notification deep links", () => {
  it("maps tenant notifications to tenant dashboard routes", () => {
    assert.equal(
      getDefaultNotificationActionUrl("WATER_BILL_ISSUED", "tenant"),
      "/dashboard/tenant/water-bills",
    );
    assert.equal(
      getDefaultNotificationActionUrl("ISSUE_CREATED", "tenant"),
      "/dashboard/tenant/issues",
    );
  });

  it("maps org staff notifications to org dashboard routes", () => {
    assert.equal(
      getDefaultNotificationActionUrl("ISSUE_CREATED", "org_staff"),
      "/dashboard/org/issues",
    );
    assert.equal(
      getDefaultNotificationActionUrl("PAYMENT_RECEIVED", "org_staff"),
      "/dashboard/org/payments",
    );
  });

  it("maps caretaker notifications to caretaker dashboard routes", () => {
    assert.equal(
      getDefaultNotificationActionUrl("WATER_BILL_ISSUED", "caretaker"),
      "/dashboard/caretaker/water-bills",
    );
    assert.equal(
      getDefaultNotificationActionUrl("ISSUE_CREATED", "caretaker"),
      "/dashboard/caretaker/today",
    );
  });

  it("prefers explicit action URLs and reads them from provider responses", () => {
    assert.equal(
      resolveNotificationActionUrl({
        type: "GENERAL",
        userId: "user-1",
        actionUrl: "/platform/onboarding",
      }),
      "/platform/onboarding",
    );

    assert.equal(
      readNotificationActionUrl({ actionUrl: "/dashboard/org/notifications" }),
      "/dashboard/org/notifications",
    );
    assert.equal(readNotificationActionUrl({ actionUrl: "https://evil.example" }), null);
  });

  it("opens payment review for old manual-payment notifications without a useful link", () => {
    for (const title of ["Manual bill payment needs verification", "Manual payment needs verification", "Manual water payment needs verification", "Manual advance rent needs verification"]) {
      for (const actionUrl of [undefined, "/dashboard/org/notifications"]) {
        assert.equal(resolveNotificationActionUrl({ type: "GENERAL", audience: "org_staff", title, actionUrl }), "/dashboard/org/payments#pending-payments");
      }
      assert.equal(resolveNotificationActionUrl({ type: "GENERAL", audience: "tenant", title }), "/dashboard/tenant/notifications");
      assert.equal(resolveNotificationActionUrl({ type: "GENERAL", audience: "org_staff", title, actionUrl: "/dashboard/org/payments?tab=history" }), "/dashboard/org/payments?tab=history");
    }
    assert.equal(resolveNotificationActionUrl({ type: "GENERAL", audience: "org_staff", title: "Office update" }), "/dashboard/org/notifications");
  });
  it("resolves audience from recipient shape", () => {
    assert.equal(resolveNotificationAudience({ tenantId: "tenant-1" }), "tenant");
    assert.equal(
      resolveNotificationAudience({ userId: "user-1", tenantId: "tenant-1" }),
      "tenant",
    );
    assert.equal(resolveNotificationAudience({ userId: "user-1" }), "org_staff");
    assert.equal(resolveNotificationAudience({}), "default");
  });

  it("keeps tenants inside their portal even with a stored management link", () => {
    for (const actionUrl of ["/dashboard/org/payments", "/platform", "//evil.example", "/dashboard/tenant/../../org/payments", "/dashboard/tenant%2f..%2forg", "/dashboard/tenantish", "https://evil.example"]) {
      assert.equal(resolveNotificationActionUrl({ type: "PAYMENT_VERIFIED", audience: "tenant", actionUrl }), "/dashboard/tenant/payments");
    }
    assert.equal(resolveNotificationActionUrl({ type: "ISSUE_CREATED", audience: "tenant", actionUrl: "/dashboard/tenant/issues?filter=open" }), "/dashboard/tenant/issues?filter=open");
  });
});

it("stored notification links reject external and ambiguous destinations", () => {
  for (const actionUrl of ["//evil.example", "/\\evil.example", "/%2fevil.example", "/%5cevil.example", "/\nevil.example", "javascript:alert(1)", 42, null]) {
    assert.equal(readNotificationActionUrl({ actionUrl }), null);
  }
  assert.equal(readNotificationActionUrl({ actionUrl: "/dashboard/org/payments?tab=pending#review" }), "/dashboard/org/payments?tab=pending#review");
});
