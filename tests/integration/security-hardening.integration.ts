import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { configureTestDatabase } from "./database-safety";
import type { AppSession } from "../../apps/web/src/lib/auth/session";
const databaseUrl = configureTestDatabase();

test("setup links support accounts without email and atomically reject replay while revoking sessions", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { createAccountSetupUrl } = await import("../../apps/web/src/lib/auth/account-setup");
  const { redeemPasswordLink } = await import("../../apps/web/src/lib/auth/redeem-password-link");
  const { hashOpaqueToken } = await import("../../apps/web/src/lib/crypto/tokens");
  const user = await prisma.user.create({ data: { fullName: "Setup test", passwordHash: "initial-test-hash", mustChangePassword: true } });
  const other = await prisma.user.create({ data: { fullName: "Other setup test", passwordHash: "other-test-hash" } });
  try {
    const started = Date.now();
    const url = await prisma.$transaction(tx => createAccountSetupUrl(tx, user.id));
    const token = new URL(url).searchParams.get("token")!;
    assert.match(token, /^[a-f0-9]{64}$/);
    const row = await prisma.passwordResetToken.findUniqueOrThrow({ where: { token: hashOpaqueToken(token, "password-reset") } });
    assert.equal(row.userId, user.id);
    assert.notEqual(row.token, token);
    assert.ok(+row.expiresAt >= started + 3599000 && +row.expiresAt <= Date.now() + 3600000);
    const sibling = await prisma.passwordResetToken.create({ data: { userId: user.id, email: "", token: randomUUID(), expiresAt: new Date(Date.now() + 60000) } });
    const unrelated = await prisma.passwordResetToken.create({ data: { userId: other.id, email: "", token: randomUUID(), expiresAt: new Date(Date.now() + 60000) } });
    await prisma.userSession.create({ data: { userId: user.id, tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 60000) } });
    const input = { tokenId: row.id, userId: user.id, email: "", passwordHash: "new-test-hash" };
    const results = await Promise.all([prisma.$transaction(tx => redeemPasswordLink(tx, input)), prisma.$transaction(tx => redeemPasswordLink(tx, input))]);
    assert.equal(results.filter(Boolean).length, 1);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(updated.passwordHash, "new-test-hash");
    assert.equal(updated.mustChangePassword, false);
    assert.ok(updated.passwordChangedAt);
    assert.equal(await prisma.userSession.count({ where: { userId: user.id } }), 0);
    assert.equal(await prisma.passwordResetToken.count({ where: { id: sibling.id } }), 0);
    assert.equal(await prisma.passwordResetToken.count({ where: { id: unrelated.id } }), 1);
    const expired = await prisma.passwordResetToken.create({ data: { userId: user.id, email: "", token: randomUUID(), expiresAt: new Date(Date.now() - 1000) } });
    assert.equal(await prisma.$transaction(tx => redeemPasswordLink(tx, { ...input, tokenId: expired.id, passwordHash: "must-not-apply" })), false);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash, "new-test-hash");
  } finally {
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: [user.id, other.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, other.id] } } });
    await prisma.$disconnect();
  }
});

test("private payment evidence is readable only through scoped payment queries", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { createPaymentProofAsset, readPaymentProof } = await import("../../apps/web/src/lib/payments/proof");
  const { paymentProofWhere } = await import("../../apps/web/src/lib/payments/proof-access");
  const { validateImageBytes } = await import("../../apps/web/src/lib/uploads/secure-image");
  const directory = await mkdtemp(path.join(tmpdir(), "estatedesk-private-proof-test-"));
  const previousDirectory = process.cwd();
  const names = ["NODE_ENV", "PAYMENT_PROOF_BUCKET", "CF_IMAGES_API_TOKEN", "CF_IMAGES_ACCOUNT_ID", "CLOUDFLARE_ACCOUNT_ID", "CF_IMAGES_HASH", "NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH", "CLOUDFLARE_ACCOUNT_HASH"];
  const previous = names.map(name => process.env[name]);
  const suffix = randomUUID();
  const org = await prisma.organization.create({ data: { name: "Proof test", slug: `proof-${suffix}` } });
  const otherOrg = await prisma.organization.create({ data: { name: "Other proof test", slug: `proof-other-${suffix}` } });
  const user = await prisma.user.create({ data: { fullName: "Proof owner", passwordHash: "test-only" } });
  const stranger = await prisma.user.create({ data: { fullName: "Other payer", passwordHash: "test-only" } });
  try {
    for (const name of names) delete process.env[name];
    Reflect.set(process.env, "NODE_ENV", "test");
    process.chdir(directory);
    const image = validateImageBytes(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG2kAAAAASUVORK5CYII=", "base64"));
    const payment = await prisma.payment.create({ data: { orgId: org.id, payerUserId: user.id, amount: 100, method: "CASH", targetType: "RENT" } });
    const asset = await createPaymentProofAsset(prisma, { image, fileName: "receipt.png", orgId: org.id, userId: user.id, paymentId: payment.id });
    assert.equal(asset.key, `/api/payments/${payment.id}/proof`);
    assert.ok(!JSON.stringify(asset.metadata).includes("publicUrl"));
    assert.deepEqual(await readPaymentProof(asset), image.buffer);
    const session: AppSession = { userId: user.id, email: null, fullName: "Proof owner", platformRole: "USER", activeOrgId: org.id, activeOrgRole: "TENANT", mustChangePassword: false, requiresTermsAcceptance: false, membershipScope: { scopeType: "ORG", scopeId: "ORG_SCOPE" } };
    const count = async (change: Partial<AppSession>) => {
      const where = paymentProofWhere({ ...session, ...change }, payment.id);
      return where ? prisma.payment.count({ where }) : 0;
    };
    assert.equal(await count({}), 1);
    assert.equal(await count({ userId: stranger.id }), 0);
    assert.equal(await count({ activeOrgId: otherOrg.id }), 0);
    assert.equal(await count({ activeOrgRole: "MANAGER", membershipScope: { scopeType: "ORG", scopeId: "ORG_SCOPE" } }), 1);
    assert.equal(await count({ activeOrgRole: "MANAGER", membershipScope: { scopeType: "PROPERTY", scopeId: "unassigned" } }), 0);
    assert.equal(await count({ activeOrgRole: "MANAGER", membershipScope: null }), 0);
    Reflect.set(process.env, "NODE_ENV", "production");
    await assert.rejects(createPaymentProofAsset(prisma, { image, fileName: "receipt.png", orgId: org.id, userId: user.id, paymentId: payment.id }), /private PAYMENT_PROOF_BUCKET/);
  } finally {
    process.chdir(previousDirectory);
    names.forEach((name, index) => { if (previous[index] === undefined) delete process.env[name]; else process.env[name] = previous[index]; });
    await prisma.organization.deleteMany({ where: { id: { in: [org.id, otherOrg.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, stranger.id] } } });
    await prisma.$disconnect();
    await rm(directory, { recursive: true, force: true });
  }
});
