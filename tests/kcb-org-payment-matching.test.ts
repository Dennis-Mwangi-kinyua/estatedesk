import assert from "node:assert/strict";
import test from "node:test";
import { matchKcbIpnPayment } from "../apps/web/src/lib/kcb/match-ipn-payment";

const notification = {
  transactionReference: "BANK-TXN-1",
  customerReference: "RENT-42",
  transactionAmount: "2500",
  creditAccountIdentifier: "0012345678",
};

function makeDb(input: {
  settings: Array<{ orgId: string; customFields: unknown }>;
  byKey?: Record<string, unknown> | null;
  external?: Array<Record<string, unknown>>;
  recent?: Array<Record<string, unknown>>;
}) {
  const queries: { payments: any[]; settings: any[] } = { payments: [], settings: [] };
  const db = {
    payment: {
      findFirst: async (query: any) => {
        queries.payments.push(query);
        return input.byKey ?? null;
      },
      findMany: async (query: any) => {
        queries.payments.push(query);
        const rows = queries.payments.length === 2
          ? input.external ?? []
          : input.recent ?? [];
        return rows.filter((row) => !query.where.orgId || row.orgId === query.where.orgId);
      },
    },
    organizationSettings: {
      findMany: async (query: any) => {
        queries.settings.push(query);
        return input.settings;
      },
    },
  };
  return { db: db as never, queries };
}

const fieldsForAccount = (account: string) => ({
  paymentInstructions: { kcbAccountNumber: account, kcbPaybill: "522522" },
});

test("KCB reference matching is constrained to the callback account's organization", async () => {
  const foreignPayment = {
    id: "foreign", orgId: "org-b", verificationStatus: "PENDING",
    amount: 2500, externalReference: "RENT-42", reference: null,
    transactionReferenceKey: null,
  };
  const { db } = makeDb({
    settings: [
      { orgId: "org-a", customFields: fieldsForAccount("0012345678") },
      { orgId: "org-b", customFields: fieldsForAccount("0098765432") },
    ],
    external: [foreignPayment],
  });

  const result = await matchKcbIpnPayment(db, notification);
  assert.equal(result.payment, null);
});

test("amount matching requires exactly one pending payment in the resolved organization", async () => {
  const payment = (id: string) => ({
    id, orgId: "org-a", verificationStatus: "PENDING", amount: 2500,
    externalReference: null, reference: null, transactionReferenceKey: null,
  });
  const { db } = makeDb({
    settings: [
      { orgId: "org-a", customFields: fieldsForAccount("0012345678") },
      { orgId: "org-b", customFields: fieldsForAccount("0098765432") },
    ],
    recent: [payment("first"), payment("second")],
  });

  const result = await matchKcbIpnPayment(db, notification);
  assert.equal(result.payment, null);
});

test("shared paybill alone does not identify an organization", async () => {
  const { db } = makeDb({
    settings: [
      { orgId: "org-a", customFields: fieldsForAccount("0012345678") },
      { orgId: "org-b", customFields: fieldsForAccount("0098765432") },
    ],
  });

  const result = await matchKcbIpnPayment(db, {
    ...notification,
    creditAccountIdentifier: undefined,
    organizationShortCode: "522522",
  });
  assert.equal(result.payment, null);
});
