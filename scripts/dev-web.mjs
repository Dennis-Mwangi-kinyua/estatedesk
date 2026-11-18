import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--webpack", ...process.argv.slice(2)], {
  cwd: fileURLToPath(new URL("../apps/web", import.meta.url)),
  stdio: "inherit",
  env: { ...process.env, WATCHPACK_POLLING: process.env.WATCHPACK_POLLING ?? "true" },
});
child.on("error", error => { console.error(error.message); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { child.kill(signal); });
