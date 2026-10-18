import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Check the produced artifact, not only source presence: unpublished mobile
// handlers otherwise become HTML 404s in the signed-in iOS/Android apps.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "apps/web/src/app/api/mobile");
const manifestPath = path.join(root, "apps/web/.next/server/app-paths-manifest.json");
function routes(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? routes(file) : entry.name === "route.ts" ? [file] : [];
  });
}
let manifest;
try { manifest = JSON.parse(readFileSync(manifestPath, "utf8")); }
catch { console.error("No production route manifest found. Run npm run build first."); process.exit(1); }
const required = [
  "/api/mobile/workspace/action/route",
  "/api/mobile/help/route",
  "/api/mobile/workspace/screen/route",
  "/api/mobile/legal/route",
  "/api/mobile/security/route",
  "/api/mobile/tenant/rewards/route",
  "/api/mobile/tenant/inspections/route",
  "/api/mobile/tenant/lease-signing/route",
  "/api/mobile/tenant/lease-signing/[id]/document/route",
  "/api/mobile/tenant/issues/confirm/route",
  "/api/mobile/tenant/community/route",
  "/api/mobile/tenant/expenditures/route",
  "/api/mobile/tenant/profile/route",
  "/api/mobile/tenant/move-outs/route",
];
const expected = [...new Set([...required, ...routes(sourceRoot).map(file => `/api/mobile/${path.relative(sourceRoot, file).split(path.sep).join("/").replace(/\.ts$/, "")}`)])];
const missing = expected.filter(route => !Object.hasOwn(manifest, route));
if (missing.length) {
  console.error(`Missing ${missing.length} mobile routes from the production artifact:\n${missing.join("\n")}`);
  process.exit(1);
}
console.log(`All ${expected.length} native mobile routes are present in the production artifact.`);
console.log("Signed-in smoke tests against the deployed backend remain required.");
