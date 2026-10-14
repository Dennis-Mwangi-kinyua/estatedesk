import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { build } from "esbuild";

// Exercise navigation separately from the read acknowledgement; slow or failed writes must not claim success.
test("notification navigation stays available while read acknowledgement is pending or fails", async () => {
  const state = { routes: [] as string[], readEvents: 0, viewed: 0, refreshes: 0 };
  const originalFetch = globalThis.fetch;
  const globals = globalThis as typeof globalThis & { notificationNavigationFixture?: typeof state; window?: unknown };
  const originalWindow = globals.window;
  globals.notificationNavigationFixture = state;
  Object.defineProperty(globalThis, "window", { configurable: true, writable: true, value: { dispatchEvent: () => { state.readEvents++; } } });
  try {
    const bundle = await build({ entryPoints: [path.resolve("apps/web/src/components/notifications/notification-view-button.tsx")], bundle: true, write: false, format: "cjs", platform: "node", packages: "external", jsx: "automatic", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "navigation-fixture", setup(builder) {
      builder.onResolve({ filter: /^(react|next\/navigation)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "react" ? "export const useState = initial => [initial, () => {}];" : "export const useRouter = () => ({ push: href => globalThis.notificationNavigationFixture.routes.push(href), refresh: () => globalThis.notificationNavigationFixture.refreshes++ });", loader: "js" }));
    } }] });
    type Element = { props: { children?: Element[]; onClick?: () => Promise<void> } };
    const module = { exports: {} as { NotificationViewButton: (props: object) => Element } };
    new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(path.resolve("package.json")), module, module.exports);
    const click = (element: Element) => {
      const wrapper = element.props.children?.[0];
      const button = wrapper?.props.children?.[0];
      assert.equal(typeof button?.props.onClick, "function");
      return button!.props.onClick!;
    };
    const destination = "/dashboard/caretaker/issues/work-order";
    let complete!: (value: Response) => void;
    let requestSignal: AbortSignal | null | undefined;
    globalThis.fetch = async (_url, options) => { requestSignal = options?.signal; return new Promise<Response>(resolve => { complete = resolve; }); };
    const button = module.exports.NotificationViewButton({ notificationId: "notice", href: destination, onViewedAction: () => { state.viewed++; } });
    const pending = click(button)();
    assert.deepEqual(state.routes, [destination]);
    assert.equal(state.viewed, 0);
    assert.ok(requestSignal instanceof AbortSignal);
    complete(Response.json({ actionUrl: destination }));
    await pending;
    assert.equal(state.viewed, 1);
    assert.equal(state.readEvents, 1);
    assert.deepEqual(state.routes, [destination]);

    state.viewed = 0; state.readEvents = 0; state.routes = [];
    globalThis.fetch = async () => { throw new Error("Network timed out"); };
    const failed = module.exports.NotificationViewButton({ notificationId: "notice", href: destination, onViewedAction: () => { state.viewed++; } });
    await click(failed)();
    assert.deepEqual(state.routes, [destination]);
    assert.equal(state.viewed, 0);
    assert.equal(state.readEvents, 0);

    state.routes = [];
    globalThis.fetch = async () => Response.json({ actionUrl: destination });
    const unknown = module.exports.NotificationViewButton({ notificationId: "notice" });
    await click(unknown)();
    assert.deepEqual(state.routes, [destination]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) Reflect.deleteProperty(globalThis, "window");
    else Object.defineProperty(globalThis, "window", { configurable: true, writable: true, value: originalWindow });
    delete globals.notificationNavigationFixture;
  }
});
