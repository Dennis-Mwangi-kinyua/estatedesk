import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";

test("client telemetry bounds payloads, rejects foreign origins, and drops reports during limiter outages", async () => {
  const fixture = {
    session: null as null | { userId: string; activeOrgId: string },
    allowed: true,
    limiterError: false,
    logs: [] as Array<{ context: string; meta?: Record<string, unknown> }>,
  };
  const mocks: Record<string, string> = {
    "@/lib/auth/session": "export async function getUserSession(){return fixture.session;}",
    "@/lib/rate-limit": "export async function checkRateLimit(){if(fixture.limiterError)throw Error('Unavailable');return {allowed:fixture.allowed};}",
    "@/lib/errors/server-error-log": "export function logServerError(context,error,meta){fixture.logs.push({context,meta});}",
  };
  const bundle = await build({
    entryPoints: ["apps/web/src/app/api/monitoring/client-errors/route.ts"],
    bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json",
    plugins: [{ name: "telemetry-fixture", setup(builder) {
      builder.onResolve({ filter: /.*/ }, args => args.path in mocks ? { path: args.path, namespace: "fixture" } : undefined);
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path], loader: "js" }));
    } }],
  });
  const mod = { exports: {} as { POST: (request: Request) => Promise<Response> } };
  new Function("require", "module", "exports", "fixture", bundle.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports, fixture);
  const send = (body: string, origin = "http://localhost") => mod.exports.POST(new Request("http://localhost/api/monitoring/client-errors", {
    method: "POST", headers: { origin, "content-type": "application/json" }, body,
  }));

  assert.equal((await send('{}')).status, 204);
  assert.equal(fixture.logs.length, 0);
  assert.equal((await send('{}', 'https://foreign.example')).status, 403);
  fixture.session = { userId: "signed-in-user", activeOrgId: "own-org" };
  fixture.allowed = false;
  assert.equal((await send('{}')).status, 429);
  fixture.allowed = true;
  fixture.limiterError = true;
  assert.equal((await send('{}')).status, 204);
  assert.equal(fixture.logs.filter(log => log.context === "client.ui").length, 0);
  fixture.limiterError = false;
  assert.equal((await send('x'.repeat(5000))).status, 413);
  assert.equal((await send('invalid-json')).status, 400);
  assert.equal((await send('{}')).status, 400);
  assert.equal((await send(JSON.stringify({ context: "page-boundary", path: "/stays", userId: "forged-user", orgId: "other-org" }))).status, 204);
  const report = fixture.logs.find(log => log.context === "client.ui");
  assert.equal(report?.meta?.userId, "signed-in-user");
  assert.equal(report?.meta?.orgId, "own-org");
});
