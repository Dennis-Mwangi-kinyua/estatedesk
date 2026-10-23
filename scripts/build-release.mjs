import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { root, protocolVersion, sourceFingerprint, releaseStampPath } from "./lib/workflow-release.mjs";
const require = createRequire(import.meta.url);
const kind = process.argv[2];
if (!["web", "mobile"].includes(kind)) throw new Error("Use build-release.mjs web|mobile");
const before = sourceFingerprint(kind);
const cwd = path.join(root, `apps/${kind}`);
const commands = kind === "web" ? [
  [require.resolve("prisma/build/index.js"), "generate", "--schema", "../../prisma/schema.prisma"],
  [require.resolve("next/dist/bin/next"), "build", "--webpack"],
] : [[path.join(cwd, "node_modules/expo/bin/cli"), "export", "--platform", "all", "--output-dir", "dist"]];
for (const args of commands) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (sourceFingerprint(kind) !== before) throw new Error("Source changed during the build. Rebuild before releasing.");
writeFileSync(releaseStampPath(kind), JSON.stringify({ kind, protocolVersion, sourceFingerprint: before, builtAt: new Date().toISOString() }, null, 2));
console.log(`${kind} artifact recorded for workflow protocol ${protocolVersion}.`);
