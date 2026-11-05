import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const protocolVersion = Number(readFileSync(path.join(root, "packages/contracts/src/mobile-release.ts"), "utf8").match(/WORKFLOW_PROTOCOL_VERSION\s*=\s*(\d+)/)?.[1]);
if (!Number.isInteger(protocolVersion)) throw new Error("Missing workflow protocol version");

function files(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    if (["node_modules", ".next", "dist", "android", "ios", ".expo", ".git"].includes(entry.name)) return [];
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? files(file) : /\.(tsx?|m?js|cjs|json|svg|png|sql|prisma|css|ico|webmanifest|woff2?|webp|jpe?g|avif|txt|xml)$/i.test(entry.name) ? [file] : [];
  });
}
export function sourceFingerprint(kind, sourceRoot = root) {
  const folders = kind === "web" ? ["apps/web/src", "apps/web/public", "packages", "services", "prisma"] : ["apps/mobile/src", "apps/mobile/assets", "apps/mobile/plugins", "packages/contracts"];
  const shared = ["package.json", "package-lock.json", "scripts/build-release.mjs", "scripts/lib/workflow-release.mjs"];
  const extra = kind === "web" ? [...shared, "apps/web/proxy.ts", "apps/web/middleware.ts", "apps/web/next.config.ts", "apps/web/package.json", "apps/web/tsconfig.json", "apps/web/vercel.json", "vercel.json", "prisma.config.ts"] : [...shared, "apps/mobile/App.tsx", "apps/mobile/index.ts", "apps/mobile/app.config.ts", "apps/mobile/package.json"];
  const hash = createHash("sha256");
  for (const file of [...folders.flatMap(folder => files(path.join(sourceRoot, folder))), ...extra.map(file => path.join(sourceRoot, file))].sort()) {
    hash.update(path.relative(sourceRoot, file)); hash.update("\0"); hash.update(readFileSync(file)); hash.update("\0");
  }
  return hash.digest("hex");
}
export function releaseStampPath(kind) {
  return path.join(root, kind === "web" ? "apps/web/.next/workflow-release.json" : "apps/mobile/dist/workflow-release.json");
}
