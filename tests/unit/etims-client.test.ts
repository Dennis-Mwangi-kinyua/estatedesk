import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEtimsSalesPayload,
  getEtimsClientConfig,
  getEtimsReadinessSummary,
} from "../../apps/web/src/lib/tax/etims-client";
import { buildEtimsReadyReceiptFields } from "../../apps/web/src/lib/tax/etims-receipt";

describe("KRA eTIMS client", () => {
  it("builds OSCU-style sales payload from receipt fields", () => {
    const fields = buildEtimsReadyReceiptFields({
      serialNumber: "RCP-100",
      organizationKraPin: "P051234567X",
      amount: 12000,
      allocations: [
        { period: "2026-07", description: "Service charge", amount: 2000 },
        { period: "2026-07", description: "Rent", amount: 10000 },
      ],
      controlUnitSerial: "KRACUTEST01",
    });
    const payload = buildEtimsSalesPayload(fields);
    assert.equal(payload.tin, "P051234567X");
    assert.equal(payload.invcNo, "RCP-100");
    assert.equal(payload.totAmt, 12000);
    assert.equal(payload.itemList.length, 2);
    assert.equal(payload.cuSerial, "KRACUTEST01");
  });

  it("reports unconfigured readiness without credentials", () => {
    const previous = {
      env: process.env.KRA_ETIMS_ENVIRONMENT,
      id: process.env.KRA_ETIMS_CLIENT_ID,
      secret: process.env.KRA_ETIMS_CLIENT_SECRET,
    };
    delete process.env.KRA_ETIMS_ENVIRONMENT;
    delete process.env.KRA_ETIMS_CLIENT_ID;
    delete process.env.KRA_ETIMS_CLIENT_SECRET;

    const config = getEtimsClientConfig();
    const readiness = getEtimsReadinessSummary();
    assert.equal(config.configured, false);
    assert.ok(readiness.notes.length > 0);

    if (previous.env !== undefined) process.env.KRA_ETIMS_ENVIRONMENT = previous.env;
    if (previous.id !== undefined) process.env.KRA_ETIMS_CLIENT_ID = previous.id;
    if (previous.secret !== undefined) {
      process.env.KRA_ETIMS_CLIENT_SECRET = previous.secret;
    }
  });
});
