import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";

function worker(headers: Record<string, string> = {}) {
 const handlers = new Map<string, (event: any) => void>();
 const buckets = new Map<string, Map<string, Response>>();
 function bucket(name: string) {
  if (!buckets.has(name)) buckets.set(name, new Map());
  const entries = buckets.get(name)!;
  return { match: async (request: Request) => entries.get(request.url)?.clone(), put: async (request: Request, response: Response) => { entries.set(request.url, response); } };
 }
 let fetches = 0;

 runInNewContext(readFileSync("apps/web/public/sw.js", "utf8"), {
  self: { clients: { claim: async () => {} }, location: { origin: "https://example.test" }, addEventListener: (name: string, handler: (event: any) => void) => handlers.set(name, handler) },
  caches: {
   open: async (name: string) => bucket(name), keys: async () => [...buckets.keys()], delete: async (name: string) => buckets.delete(name),
   match: async (request: Request) => { for (const entries of buckets.values()) { const hit = entries.get(request.url); if (hit) return hit.clone(); } },
  }, URL, Response,
  fetch: async () => { fetches++; return new Response(`asset-${fetches}`, { headers }); },
 });
 async function request(path: string, mode = "cors") {
  let response: Promise<Response> | undefined;
  const pending: Promise<unknown>[] = [];
  handlers.get("fetch")!({ request: { url: `https://example.test${path}`, method: "GET", mode }, respondWith: (value: Promise<Response>) => { response = value; }, waitUntil: (value: Promise<unknown>) => pending.push(value) });
  const result = await response;
  await Promise.all(pending);
  return result;
 }
 return {
  request, fetches: () => fetches,
  seed: async (name: string, path: string, content: string) => bucket(name).put(new Request(`https://example.test${path}`), new Response(content)),
  activate: async () => { let work: Promise<unknown> | undefined; handlers.get("activate")!({ waitUntil: (value: Promise<unknown>) => { work = value; } }); await work; },
  cacheNames: () => [...buckets.keys()],
 };
}

test("hashed bundles reuse cache without another network request", async () => {
 const sw = worker();
 assert.equal(await (await sw.request("/_next/static/chunks/hash.js"))?.text(), "asset-1");
 assert.equal(await (await sw.request("/_next/static/chunks/hash.js"))?.text(), "asset-1");
 assert.equal(sw.fetches(), 1);
});

test("images return cached content while refreshing for the next visit", async () => {
 const sw = worker();
 await sw.request("/images/hero.png");
 assert.equal(await (await sw.request("/images/hero.png"))?.text(), "asset-1");
 assert.equal(await (await sw.request("/images/hero.png"))?.text(), "asset-2");
});

test("account APIs and non-asset requests bypass asset cache", async () => {
 const sw = worker();
 assert.equal(await sw.request("/api/mobile/session"), undefined);
 assert.equal(await sw.request("/dashboard/tenant?_rsc=example"), undefined);
 assert.equal(await sw.request("/login?_rsc=example"), undefined);
 assert.equal(sw.fetches(), 0);
});

for (const directive of ["private", "no-store"]) {
 test(`assets marked ${directive} are never stored`, async () => {
  const sw = worker({ "Cache-Control": directive });
  await sw.request("/_next/static/chunks/hash.js");
  await sw.request("/_next/static/chunks/hash.js");
  assert.equal(sw.fetches(), 2);
 });
}

test("authenticated HTML always reaches the network", async () => {
 const sw = worker();
 await sw.request("/dashboard/tenant", "navigate");
 await sw.request("/dashboard/tenant", "navigate");
 assert.equal(sw.fetches(), 2);
});

test("worker updates retain recent hashed bundles used by existing tabs", async () => {
 const sw = worker();
 await sw.seed("estatedesk-pwa-v0.1.0-static", "/_next/static/obsolete.js", "obsolete");
 await sw.seed("estatedesk-pwa-v0.2.1-static", "/_next/static/previous.js", "previous");
 await sw.seed("estatedesk-pwa-v0.2.2-static", "/_next/static/current-tab.js", "current-tab");
 await sw.activate();
 assert.equal(sw.cacheNames().includes("estatedesk-pwa-v0.1.0-static"), false);
 assert.equal(await (await sw.request("/_next/static/current-tab.js"))?.text(), "current-tab");
 assert.equal(await (await sw.request("/_next/static/previous.js"))?.text(), "previous");
 assert.equal(sw.fetches(), 0);
});
