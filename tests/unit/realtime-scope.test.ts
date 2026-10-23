import test from "node:test";
import assert from "node:assert/strict";
import { matchesLiveScope } from "../../apps/web/src/lib/realtime/scope";

test("live signals are restricted to the server-resolved user and organization", () => {
  const session = { userId: "alice", activeOrgId: "org-a", platformRole: "NONE" };
  for (const scope of ["user:alice", "org:org-a"]) assert.equal(matchesLiveScope(scope, session), true);
  for (const scope of ["user:bob", "org:org-b", "org:org-a-extra", "platform", "", "{}"]) assert.equal(matchesLiveScope(scope, session), false);
  assert.equal(matchesLiveScope("org:null", { ...session, activeOrgId: null }), false);
});

test("only platform administrator roles receive platform-wide invalidations", () => {
  for (const platformRole of ["PLATFORM_ADMIN", "SUPER_ADMIN"]) assert.equal(matchesLiveScope("platform", { userId: "a", activeOrgId: null, platformRole }), true);
  for (const platformRole of ["NONE", "TENANT", "ORG_ADMIN"]) assert.equal(matchesLiveScope("platform", { userId: "a", activeOrgId: null, platformRole }), false);
});

test("marketplace updates require a server-verified active provider", () => {
  const session = { userId: "a", activeOrgId: null, platformRole: "NONE" };
  assert.equal(matchesLiveScope("marketplace", session), false);
  assert.equal(matchesLiveScope("marketplace", { ...session, provider: true }), true);
});
