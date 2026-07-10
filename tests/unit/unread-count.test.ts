import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPersonalUnreadNotificationWhere } from "../../apps/web/src/lib/notifications/unread-count-query";

describe("unread notification count", () => {
  it("scopes tenant unread notifications to tenant and user records", () => {
    const where = buildPersonalUnreadNotificationWhere({
      orgId: "org_1",
      userId: "user_1",
      orgRole: "TENANT",
      tenantId: "tenant_1",
    });

    assert.equal(where.orgId, "org_1");
    assert.ok("OR" in where);
    if ("OR" in where) {
      assert.deepEqual(where.OR, [{ tenantId: "tenant_1" }, { userId: "user_1" }]);
    }
  });

  it("scopes staff unread notifications to the signed-in user", () => {
    const where = buildPersonalUnreadNotificationWhere({
      orgId: "org_1",
      userId: "user_2",
      orgRole: "MANAGER",
      tenantId: null,
    });

    assert.ok("userId" in where);
    if ("userId" in where) {
      assert.equal(where.userId, "user_2");
    }
    assert.equal("OR" in where, false);
  });
});