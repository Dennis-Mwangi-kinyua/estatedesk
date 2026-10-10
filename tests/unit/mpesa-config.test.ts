import assert from "node:assert/strict";
import test from "node:test";
import { getMpesaConfigForOrg, getMpesaConfigForCallback } from "../../apps/web/src/lib/mpesa/config";

test("separate M-Pesa connections isolate organisation credentials and callbacks", () => {
  const keys = ["ORG_ID", "ENVIRONMENT", "CONSUMER_KEY", "CONSUMER_SECRET", "SHORTCODE", "PASSKEY", "CALLBACK_SECRET", "CALLBACK_URL"];
  const names = ["MPESA_ADDITIONAL_PREFIXES", ...["MPESA", "MPESA_TEST_SECOND"].flatMap(prefix => keys.map(key => `${prefix}_${key}`))];
  const previous = Object.fromEntries(names.map(key => [key, process.env[key]]));
  try {
    process.env.MPESA_ADDITIONAL_PREFIXES = "MPESA_TEST_SECOND";
    for (const prefix of ["MPESA", "MPESA_TEST_SECOND"]) {
      for (const key of keys) process.env[`${prefix}_${key}`] = `${prefix}-${key}`;
      process.env[`${prefix}_ENVIRONMENT`] = prefix === "MPESA" ? "production" : "sandbox";
    }
    assert.equal(getMpesaConfigForOrg("MPESA-ORG_ID")?.environment, "production");
    assert.equal(getMpesaConfigForOrg("MPESA_TEST_SECOND-ORG_ID")?.consumerKey, "MPESA_TEST_SECOND-CONSUMER_KEY");
    assert.equal(getMpesaConfigForOrg("MPESA_TEST_SECOND-ORG_ID")?.environment, "sandbox");
    assert.equal(getMpesaConfigForCallback("MPESA_TEST_SECOND-CALLBACK_SECRET")?.orgId, "MPESA_TEST_SECOND-ORG_ID");
    assert.equal(getMpesaConfigForCallback("unknown"), undefined);
    assert.equal(getMpesaConfigForOrg("unknown"), undefined);
    process.env.MPESA_TEST_SECOND_CALLBACK_SECRET = process.env.MPESA_CALLBACK_SECRET;
    assert.equal(getMpesaConfigForCallback(process.env.MPESA_CALLBACK_SECRET!), undefined);
    process.env.MPESA_TEST_SECOND_ORG_ID = process.env.MPESA_ORG_ID;
    assert.equal(getMpesaConfigForOrg(process.env.MPESA_ORG_ID), undefined);
    process.env.MPESA_TEST_SECOND_ORG_ID = "MPESA_TEST_SECOND-ORG_ID";
    process.env.MPESA_TEST_SECOND_CALLBACK_SECRET = "MPESA_TEST_SECOND-CALLBACK_SECRET";
    delete process.env.MPESA_TEST_SECOND_PASSKEY;
    assert.equal(getMpesaConfigForOrg("MPESA_TEST_SECOND-ORG_ID"), undefined);
  } finally {
    for (const key of names) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
