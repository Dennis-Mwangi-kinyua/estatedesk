import test from "node:test";
import assert from "node:assert/strict";
import { createSupportService } from "../../apps/web/src/features/customer-support/application/service";
import type { SupportRepository, TicketScope } from "../../apps/web/src/features/customer-support/application/ports";
test("support workflows enforce ownership, setup and throttling independently of routes", async () => {
  const scopes: TicketScope[] = []; let writes = 0; let allowed = true;
  const repository: SupportRepository = {
    async create() { writes++; return "ticket"; }, async list(scope) { scopes.push(scope); return []; }, async find(scope) { scopes.push(scope); return null; },
    async reply(scope) { scopes.push(scope); writes++; return false; }, async resolve(scope) { scopes.push(scope); return false; },
  };
  const service = createSupportService({ repository, allowMutation: async () => allowed });
  const actor = { userId: "customer", platformRole: "USER" };
  await service.list(actor); assert.deepEqual(scopes.pop(), { ownerId: "customer" });
  await service.list({ ...actor, platformRole: "PLATFORM_ADMIN" }); assert.deepEqual(scopes.pop(), {});
  const input = { subject: "Account problem", category: "TECHNICAL", body: "Unable to use my account." };
  await assert.rejects(service.create({ ...actor, mustChangePassword: true }, input), /setup/);
  await assert.rejects(service.create(actor, { ...input, body: "" }), /description/);
  assert.equal(writes, 0);
  allowed = false; await assert.rejects(service.create(actor, input), /Too many/); assert.equal(writes, 0);
  allowed = true; assert.equal(await service.create(actor, input), "ticket");
  await assert.rejects(service.reply(actor, { ticketId: "foreign", body: "Help" }), /unavailable/);
  assert.deepEqual(scopes.pop(), { ownerId: "customer" });
});
