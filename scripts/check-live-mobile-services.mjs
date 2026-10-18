import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "apps/web/src/app/api/mobile");
const origin = new URL(process.argv[2] ?? "https://estatedesk.co.ke");
if (origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password || (origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)))) {
  throw new Error("Provide an HTTPS server origin (or HTTP localhost), without credentials or a path.");
}
function routes(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? routes(file) : entry.name === "route.ts" ? [file] : [];
  });
}
const paths = routes(source).map(file => `/api/mobile/${path.relative(source, file).split(path.sep).join("/").replace(/\/route\.ts$/, "").replace(/\[[^/]+\]/g, "route-availability-probe")}`);
let cursor = 0;
const failures = [];
// A correctly shaped but deliberately invalid cookie gets past the proxy's
// syntax check. No account credential is read and no mutation is attempted.
const cookie = `__Host-estatedesk_session=v1.${"0".repeat(64)}.${"0".repeat(32)}`;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < paths.length) {
    const endpoint = paths[cursor++];
    try {
      const response = await fetch(new URL(endpoint, origin), {
        method: "GET", redirect: "manual", signal: AbortSignal.timeout(15000),
        headers: { Accept: "application/json", "X-EstateDesk-Client": "native", Cookie: cookie },
      });
      const json = response.headers.get("content-type")?.includes("application/json");
      if (response.status === 401 && json || response.status === 405) console.log(`AVAILABLE ${response.status} ${endpoint}`);
      else {
        const result = `${response.status === 404 ? "MISSING" : "CHECK"} ${response.status} ${endpoint}`;
        failures.push(result); console.error(result);
      }
      await response.body?.cancel();
    } catch (error) {
      failures.push(`UNREACHABLE ${endpoint}: ${error instanceof Error ? error.message : "request failed"}`);
      console.error(failures.at(-1));
    }
  }
}));
console.log(`${paths.length - failures.length}/${paths.length} mobile routes reached on ${origin.origin}.`);
console.log("This read-only routing check does not validate signed-in permissions, database access or mutations.");
if (failures.length) process.exitCode = 1;
