import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { build } from "esbuild";
import { NextRequest } from "next/server";

test("notification reads reject invalid requests before mutating records", async () => {
  const bundle = await build({
    entryPoints: [path.resolve("apps/web/src/app/api/notifications/read/route.ts")],
    bundle: true, write: false, format: "cjs", platform: "node", packages: "external",
    tsconfig: "apps/web/tsconfig.json",
    plugins: [{ name: "notification-dependencies", setup(builder) {
      builder.onResolve({ filter: /^(next\/cache|@\/lib\/auth\/session|@\/lib\/notifications\/read)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({
        contents: args.path === "next/cache"
          ? "export const revalidatePath = () => {};"
          : args.path.includes("auth/session")
            ? 'export const getUserSession = async () => ({ activeOrgRole: "TENANT" });'
            : 'export const readPersonalNotification = async (_, id) => `/dashboard/tenant/issues/${id}`; export const readAllPersonalNotifications = async () => {};',
        loader: "js",
      }));
    } }],
  });
  const module = { exports: {} as { POST: (request: NextRequest) => Promise<Response> } };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(path.resolve("package.json")), module, module.exports);
  const send = (body: string, origin = "https://example.test") => module.exports.POST(new NextRequest("https://example.test/api/notifications/read", {
    method: "POST", headers: { origin, "Content-Type": "application/json" }, body,
  }));

  for (const body of ["null", "[]", '"notice"', "{", '{}', '{"id":""}', '{"id":"   "}', '{"all":false}', '{"all":true,"id":"notice"}']) {
    assert.equal((await send(body)).status, 400, body);
  }
  assert.equal((await send(JSON.stringify({ id: "x".repeat(201) }))).status, 400);
  assert.equal((await send(JSON.stringify({ id: "x".repeat(1024) }))).status, 413);
  assert.equal((await send('{"all":true}', "https://evil.example")).status, 403);
  assert.deepEqual(await (await send('{"id":"notice"}')).json(), { actionUrl: "/dashboard/tenant/issues/notice" });
  assert.deepEqual(await (await send('{"all":true}')).json(), { actionUrl: null });
});
