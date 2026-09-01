import { readFile, writeFile } from "node:fs/promises";

const version = process.argv[2];

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version ?? "")) {
  console.error("Usage: npm run version:set -- 0.2.1");
  process.exit(1);
}

async function updateJson(path, updater) {
  const value = JSON.parse(await readFile(path, "utf8"));
  updater(value);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

await updateJson("package.json", (value) => { value.version = version; });
await updateJson("apps/web/package.json", (value) => { value.version = version; });
await updateJson("package-lock.json", (value) => {
  value.version = version;
  value.packages[""].version = version;
  value.packages["apps/web"].version = version;
});

const serviceWorkerPath = "apps/web/public/sw.js";
const serviceWorker = await readFile(serviceWorkerPath, "utf8");
const updatedServiceWorker = serviceWorker.replace(
  /^const CACHE_VERSION = "estatedesk-pwa-v[^"]+";/m,
  `const CACHE_VERSION = "estatedesk-pwa-v${version}";`,
);

if (updatedServiceWorker === serviceWorker) {
  console.error("Could not update the service-worker cache version.");
  process.exit(1);
}

await writeFile(serviceWorkerPath, updatedServiceWorker);
console.log(`EstateDesk release version set to ${version}.`);
