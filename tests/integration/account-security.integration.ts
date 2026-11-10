import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";

const databaseUrl = configureTestDatabase();
test("self-service passwords rotate the current credential and atomically revoke other devices and reset links", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { changeAccountPassword } = await import("../../apps/web/src/features/security/_lib/change-password");
  const { getAccountSecurityActivity } = await import("../../apps/web/src/lib/security/account-events");
  const { hashOpaqueToken } = await import("../../apps/web/src/lib/crypto/tokens");
  const { mobileSecurityActivitySchema } = await import("../../packages/contracts/src/mobile");
  const password = "Existing-account-password-2026!";
  const next = "A different long passphrase 2026!";
  const user = await prisma.user.create({ data: { email: `security-${randomUUID()}@example.invalid`, fullName: "Security owner", passwordHash: await bcrypt.hash(password, 10) } });
  const foreign = await prisma.user.create({ data: { fullName: "Another account", passwordHash: "fixture-only" } });
  const oldToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 3600000);
  const current = await prisma.userSession.create({ data: { userId: user.id, tokenHash: hashOpaqueToken(oldToken, "session"), expiresAt } });
  const other = await prisma.userSession.create({ data: { userId: user.id, tokenHash: randomBytes(32).toString("hex"), expiresAt } });
  const outside = await prisma.userSession.create({ data: { userId: foreign.id, tokenHash: randomBytes(32).toString("hex"), expiresAt } });
  try {
    await prisma.passwordResetToken.create({ data: { userId: user.id, email: user.email!, token: randomBytes(32).toString("hex"), expiresAt } });
    await assert.rejects(changeAccountPassword({ userId: user.id, sessionId: current.id, values: { currentPassword: "incorrect current password", newPassword: next, confirmPassword: next } }), /Current password is incorrect/);
    assert.equal(await prisma.userSession.count({ where: { userId: user.id } }), 2);
    await assert.rejects(changeAccountPassword({ userId: user.id, sessionId: outside.id, values: { currentPassword: password, newPassword: next, confirmPassword: next } }), /sign in again/i);
    await assert.rejects(changeAccountPassword({ userId: user.id, sessionId: current.id, values: { currentPassword: password, newPassword: "é".repeat(40), confirmPassword: "é".repeat(40) } }), /72 UTF-8 bytes/);
    const result = await changeAccountPassword({ userId: user.id, sessionId: current.id, values: { currentPassword: password, newPassword: next, confirmPassword: next } });
    assert.notEqual(result.token, oldToken);
    const changed = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(await bcrypt.compare(next, changed.passwordHash), true);
    assert.equal(await bcrypt.compare(password, changed.passwordHash), false);
    assert.ok(changed.passwordChangedAt);
    assert.equal((await prisma.userSession.findUniqueOrThrow({ where: { id: current.id } })).tokenHash, hashOpaqueToken(result.token, "session"));
    assert.equal(await prisma.userSession.findUnique({ where: { id: other.id } }), null);
    assert.ok(await prisma.userSession.findUnique({ where: { id: outside.id } }));
    assert.equal(await prisma.passwordResetToken.count({ where: { userId: user.id } }), 0);
    await prisma.auditLog.create({ data: { actorUserId: foreign.id, action: "ACCOUNT_PASSWORD_CHANGED", entityType: "User", entityId: foreign.id, metadata: { private: "Never expose another account" } } });
    const activity = mobileSecurityActivitySchema.parse(await getAccountSecurityActivity(user.id));
    assert.ok(activity.events.some(event => event.label.startsWith("Password changed")));
    assert.ok(activity.events.some(event => event.label.includes("not verified")));
    assert.equal(JSON.stringify(activity).includes("Never expose another account"), false);
    assert.equal(JSON.stringify(activity).includes(result.token), false);
    assert.equal(JSON.stringify(activity).includes(next), false);
    assert.equal((await prisma.auditLog.findFirstOrThrow({ where: { actorUserId: user.id, action: "ACCOUNT_PASSWORD_CHANGED" } })).orgId, null);
  } finally {
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: [user.id, foreign.id] } } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.userSession.deleteMany({ where: { userId: { in: [user.id, foreign.id] } } });
    await prisma.rateLimitBucket.deleteMany({ where: { key: `account-password:${user.id}` } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, foreign.id] } } });
    await prisma.$disconnect();
  }
});

test("concurrent password changes accept one replacement and failed guesses are rate limited", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { changeAccountPassword } = await import("../../apps/web/src/features/security/_lib/change-password");
  const password = "Concurrent-current-password-2026!";
  const user = await prisma.user.create({ data: { fullName: "Concurrent security owner", passwordHash: await bcrypt.hash(password, 10) } });
  const limited = await prisma.user.create({ data: { fullName: "Rate limited owner", passwordHash: await bcrypt.hash(password, 10) } });
  const expiresAt = new Date(Date.now() + 3600000);
  const current = await prisma.userSession.create({ data: { userId: user.id, tokenHash: randomBytes(32).toString("hex"), expiresAt } });
  const other = await prisma.userSession.create({ data: { userId: limited.id, tokenHash: randomBytes(32).toString("hex"), expiresAt } });
  try {
    const replacements = ["First replacement passphrase 2026!", "Second replacement passphrase 2026!"];
    const outcomes = await Promise.allSettled(replacements.map(next => changeAccountPassword({ userId: user.id, sessionId: current.id, values: { currentPassword: password, newPassword: next, confirmPassword: next } })));
    assert.equal(outcomes.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(await prisma.auditLog.count({ where: { actorUserId: user.id, action: "ACCOUNT_PASSWORD_CHANGED" } }), 1);
    const winner = outcomes.findIndex(result => result.status === "fulfilled");
    assert.equal(await bcrypt.compare(replacements[winner], (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash), true);
    const input = { userId: limited.id, sessionId: other.id, values: { currentPassword: "wrong password", newPassword: replacements[0], confirmPassword: replacements[0] } };
    for (let attempt = 0; attempt < 5; attempt++) await assert.rejects(changeAccountPassword(input), /Current password is incorrect/);
    await assert.rejects(changeAccountPassword({ ...input, values: { ...input.values, currentPassword: password } }), /Too many password attempts/);
    assert.equal(await bcrypt.compare(password, (await prisma.user.findUniqueOrThrow({ where: { id: limited.id } })).passwordHash), true);
    assert.ok(await prisma.userSession.findUnique({ where: { id: other.id } }));
  } finally {
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: [user.id, limited.id] } } });
    await prisma.userSession.deleteMany({ where: { userId: { in: [user.id, limited.id] } } });
    await prisma.rateLimitBucket.deleteMany({ where: { key: { in: [`account-password:${user.id}`, `account-password:${limited.id}`] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, limited.id] } } });
    await prisma.$disconnect();
  }
});

test("rate windows remain effective across database timezones and application clock skew", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { checkRateLimitWithDatabase } = await import("../../apps/web/src/lib/rate-limit");
  const key = `security-clock-test:${randomUUID()}`;
  const actualNow = Date.now;
  try {
    Date.now = () => actualNow() - 86400000;
    for (const zone of ["UTC", "Africa/Nairobi", "Pacific/Auckland"]) {
      await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT set_config('TimeZone', ${zone}, true)`;
        const input = { key: `${key}:${zone}`, limit: 2, windowMs: 60000 };
        assert.equal((await checkRateLimitWithDatabase(input, tx)).allowed, true);
        assert.equal((await checkRateLimitWithDatabase(input, tx)).allowed, true);
        const rejected = await checkRateLimitWithDatabase(input, tx);
        assert.equal(rejected.allowed, false, zone);
        assert.ok(rejected.retryAfterSeconds >= 59 && rejected.retryAfterSeconds <= 61, zone);
      });
    }
  } finally {
    Date.now = actualNow;
    await prisma.rateLimitBucket.deleteMany({ where: { key: { startsWith: key } } });
    await prisma.$disconnect();
  }
});
