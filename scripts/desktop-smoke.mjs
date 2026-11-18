import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { _electron as electron } from "playwright";

// Use disposable content and a private profile: this never signs in to production.
const root = fileURLToPath(new URL("../", import.meta.url));
const profile = await mkdtemp(path.join(tmpdir(), "estatedesk-desktop-smoke-"));
const server = createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" });
  response.end('<!doctype html><title>EstateDesk smoke</title><main><h1>Desktop workspace</h1><a href="/dashboard">Workspace</a><input aria-label="Upload" type="file"></main>');
});
let application;
try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const launchEnv = { ...process.env, ESTATEDESK_DESKTOP_URL: origin };
  delete launchEnv.ELECTRON_RUN_AS_NODE;
  application = await electron.launch({
    args: [path.join(root, "apps/desktop"), `--user-data-dir=${profile}`],
    env: launchEnv,
    timeout: 30_000,
  });
  const page = await application.firstWindow();
  await page.waitForURL(`${origin}/login?source=desktop`);
  await page.getByRole("heading", { name: "Desktop workspace" }).waitFor();
  assert.deepEqual(await page.evaluate(() => ({ node: typeof window.require, process: typeof window.process })),
    { node: "undefined", process: "undefined" });
  assert.deepEqual(await application.evaluate(({ BrowserWindow }) => {
    const contents = BrowserWindow.getAllWindows()[0].webContents;
    const preferences = contents.getLastWebPreferences();
    return {
      sandbox: preferences.sandbox, contextIsolation: preferences.contextIsolation,
      nodeIntegration: preferences.nodeIntegration, webSecurity: preferences.webSecurity,
    };
  }), { sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true });
  await application.evaluate(({ dialog }) => { dialog.showMessageBox = async () => ({ response: 0, checkboxChecked: false }); });
  assert.equal(await page.evaluate(() => Notification.requestPermission()), "denied");
  await page.getByRole("link", { name: "Workspace" }).click();
  await page.waitForURL(`${origin}/dashboard`);
  await page.getByLabel("Upload").setInputFiles({ name: "smoke.csv", mimeType: "text/csv", buffer: Buffer.from("name\nSmoke\n") });
  assert.equal(await page.getByLabel("Upload").evaluate(input => input.files[0].name), "smoke.csv");
  await page.evaluate(() => window.open("/dashboard?popup=1"));
  await page.waitForURL(`${origin}/dashboard?popup=1`);
  assert.equal(application.windows().length, 1);
  await page.reload();
  await page.getByRole("heading", { name: "Desktop workspace" }).waitFor();
  console.log(`PASS desktop launch, isolation, permissions, navigation, uploads, popup policy and reload (${process.platform})`);
} finally {
  try { await application?.close(); }
  finally {
    await new Promise(resolve => server.close(resolve));
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
