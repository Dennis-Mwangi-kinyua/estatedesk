import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getIntegrationReadiness,
  getIntegrationReadinessReport,
  integrationProviders,
} from "../../src/lib/integrations";

describe("integration readiness", () => {
  it("keeps every roadmap provider visible in the readiness report", () => {
    const report = getIntegrationReadinessReport();

    assert.ok(report.integrations.length >= 10);
    assert.ok(report.integrations.some((item) => item.id === "ke-mpesa-daraja"));
    assert.ok(report.integrations.some((item) => item.id === "ae-dld-ejari"));
    assert.equal(
      report.totals.ready +
        report.totals.partial +
        report.totals.pendingApproval +
        report.totals.misconfigured +
        report.totals.stubbed +
        report.totals.disabled,
      report.integrations.length,
    );
  });

  it("marks approval-gated providers as pending approval once live env is present", () => {
    const originalValues = new Map<string, string | undefined>();
    const provider = integrationProviders.find((item) => item.id === "ke-mpesa-daraja");

    assert.ok(provider);

    for (const item of provider.env) {
      originalValues.set(item.key, process.env[item.key]);
      process.env[item.key] = "configured";
    }

    try {
      const readiness = getIntegrationReadiness(provider);
      assert.equal(readiness.status, "PENDING_APPROVAL");
      assert.deepEqual(readiness.missingEnv, []);
    } finally {
      for (const [key, value] of originalValues) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  });
});
