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

  it("resolves audience from recipient shape", () => {
    assert.equal(resolveNotificationAudience({ tenantId: "tenant-1" }), "tenant");
    assert.equal(
      resolveNotificationAudience({ userId: "user-1", tenantId: "tenant-1" }),
      "tenant",
    );
    assert.equal(resolveNotificationAudience({ userId: "user-1" }), "org_staff");
    assert.equal(resolveNotificationAudience({}), "default");
  });
});