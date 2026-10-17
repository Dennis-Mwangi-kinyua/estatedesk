import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

// Expo adds a separate native build toolchain to the monorepo. npm audit uses
// hoisted lockfile dev flags even when --workspace filters exclude that app.
// Resolve an audit-only copy without mobile so the production gate checks the
// web server and all shared services, while retaining their locked versions.
// The repository lockfile and installed dependencies are never modified here.
const root = resolve(import.meta.dirname, "..");
const folder = mkdtempSync(join(tmpdir(), "estatedesk-web-audit-"));
try {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
  const workspaces = Object.keys(lock.packages).filter(path =>
    /^(apps|packages|services)\/[^/]+$/.test(path) && path !== "apps/mobile",
  );
  manifest.workspaces = workspaces;
  writeFileSync(join(folder, "package.json"), JSON.stringify(manifest));
  writeFileSync(join(folder, "package-lock.json"), JSON.stringify(lock));
  for (const workspace of workspaces) {
    const target = join(folder, workspace, "package.json");
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(join(root, workspace, "package.json")));
  }
  const run = args => {
    const result = spawnSync("npm", args, { cwd: folder, stdio: "inherit" });
    if (result.error) throw result.error;
    return result.status ?? 1;
  };
  const resolved = run(["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"]);
  if (resolved) process.exitCode = resolved;
  else {
    // Abort rather than audit different versions from the release lockfile.
    const scoped = JSON.parse(readFileSync(join(folder, "package-lock.json"), "utf8"));
    for (const [path, node] of Object.entries(scoped.packages)) {
      if (lock.packages[path] && node.version !== lock.packages[path].version) {
        throw new Error(`Audit dependency changed at ${path}; refresh the release lockfile first.`);
      }
    }
    process.exitCode = run(["audit", "--omit=dev", "--audit-level=high"]);
  }
} finally {
  rmSync(folder, { recursive: true, force: true });
}
