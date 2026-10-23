import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

test("browser logout rejects cross-site requests, revokes the current session and keeps guest logout separate", async () => {
  const state = { revoked: 0, deleted: [] as unknown[], fail: false };
  const bundle = await build({ entryPoints: ["apps/web/src/app/api/auth/logout/route.ts"], bundle: true, write: false, platform: "node", format: "cjs", plugins: [{ name: "logout-fixtures", setup(builder) {
    builder.onResolve({ filter: /^next\/headers$|^@\/lib\/auth\/session$|^@\/features\/bnb\/guest\/session$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "next/headers" ? "export const cookies=async()=>({delete:value=>state.deleted.push(value)});" : args.path.endsWith("guest/session") ? 'export const GUEST_COOKIE="guest-cookie";' : 'export async function clearUserSession(){if(state.fail)throw Error("unavailable");state.revoked++;}', loader: "js" }));
  } }] });
  const module = { exports: {} as { POST(request: Request): Promise<Response> } };
  new Function("module", "exports", "state", bundle.outputFiles[0].text)(module, module.exports, state);
  const post = (scope: string, headers: Record<string, string> = {}) => module.exports.POST(new Request("https://example.com/api/auth/logout", { method: "POST", headers: { origin: "https://example.com", "sec-fetch-site": "same-origin", "x-estatedesk-logout": "1", ...headers }, body: JSON.stringify({ scope }) }));
  assert.equal((await post("user", { origin: "https://evil.example" })).status, 403);
  assert.equal((await post("user", { "sec-fetch-site": "cross-site" })).status, 403);
  assert.equal((await post("user", { "x-estatedesk-logout": "" })).status, 403);
  assert.equal((await post("user", { origin: "null" })).status, 403);
  assert.equal((await post("invalid")).status, 400);
  assert.equal(state.revoked, 0);
  const response = await post("user");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(state.revoked, 1);
  assert.equal((await post("guest")).status, 200);
  assert.equal(state.revoked, 1);
  const proxied = await module.exports.POST(new Request("http://internal:3000/api/auth/logout", { method: "POST", headers: { origin: "https://example.com", "x-forwarded-host": "example.com", "sec-fetch-site": "same-origin", "x-estatedesk-logout": "1" }, body: JSON.stringify({ scope: "user" }) }));
  assert.equal(proxied.status, 200);
  assert.equal(state.revoked, 2);
  assert.deepEqual(state.deleted, [{ name: "guest-cookie", path: "/guest-stay" }]);
  state.fail = true;
  assert.equal((await post("user")).status, 503);
});
