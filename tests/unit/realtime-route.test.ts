import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import path from "node:path";

test("live stream authenticates, filters scopes, emits no record data and releases cancelled subscriptions", async () => {
  const state = { session: null as null | Record<string, unknown>, subscriptions: 0, released: 0, change: (_scope: string) => {}, disconnected: () => {} };
  const bundle = await build({ entryPoints: ["apps/web/src/app/api/realtime/route.ts"], bundle: true, write: false, platform: "node", format: "cjs", plugins: [{ name: "live-test", setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/prisma$/ }, () => ({ path: "prisma", namespace: "fixture" }));
    builder.onResolve({ filter: /^@\/lib\/auth\/session$|^@\/lib\/realtime\/listener$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onResolve({ filter: /^@\/lib\/realtime\/scope$/ }, () => ({ path: path.resolve("apps/web/src/lib/realtime/scope.ts") }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "prisma" ? "export const prisma={serviceProvider:{findUnique:async()=>null}};" : args.path.endsWith("session") ? "export const getUserSession = async () => state.session;" : "export const liveListener = {subscribe: async subscriber => {state.subscriptions++;state.change=subscriber.change;state.disconnected=subscriber.disconnected;return () => {state.released++}}};", loader: "js" }));
  } }] });
  const module = { exports: {} as { GET: (request: Request) => Promise<Response> } };
  new Function("module", "exports", "state", bundle.outputFiles[0].text)(module, module.exports, state);
  const get = (query = "", headers = {}) => module.exports.GET(new Request(`https://example.com/api/realtime${query}`, { headers }));
  assert.equal((await get()).status, 401);
  assert.equal(state.subscriptions, 0);
  state.session = { userId: "a", activeOrgId: "org-a", platformRole: "NONE", mustChangePassword: false, requiresTermsAcceptance: false };
  assert.equal((await get("", { "sec-fetch-site": "cross-site" })).status, 403);
  assert.equal(state.subscriptions, 0);
  const response = await get();
  assert.equal(response.headers.get("content-type"), "text/event-stream");
  assert.match(response.headers.get("cache-control")!, /no-store/);
  const reader = response.body!.getReader(); const decoder = new TextDecoder();
  assert.match(decoder.decode((await reader.read()).value), /event: ready/);
  state.change("org:other"); state.change("platform"); state.change("user:b");
  state.change("org:org-a");
  assert.equal(decoder.decode((await reader.read()).value), "event: change\ndata: {}\n\n");
  await reader.cancel(); assert.equal(state.released, 1);
  state.session.mustChangePassword = true;
  assert.equal((await get()).status, 403);
});
