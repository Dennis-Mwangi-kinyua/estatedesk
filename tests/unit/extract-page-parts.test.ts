import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("page extraction handles typed parameters, nested returns and trailing helpers", () => {
  const folder = mkdtempSync(join(tmpdir(), "extract-page-"));
  try {
    const input = join(folder, "page.tsx");
    const output = join(folder, "output");
    writeFileSync(input, `import Link from 'next/link';
function Helper() { return <span>Help</span>; }
export default async function ExamplePage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const items = [id].map(value => { return value; });
  return (
    <main>{items.map(value => <Link key={value} href={value}>{value}</Link>)}</main>
  );
}
function Later() { return <div>Not part of the page</div>; }
`);
    const result = spawnSync(process.execPath, ["scripts/extract-page-parts.mjs", input, "ExamplePage", output, "function Helper"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const pre = readFileSync(join(output, "pre.txt"), "utf8");
    assert.ok(pre.startsWith("const id ="));
    assert.ok(pre.includes("return value;"));
    assert.equal(readFileSync(join(output, "jsx.txt"), "utf8"), '<main>{items.map(value => <Link key={value} href={value}>{value}</Link>)}</main>');
    assert.match(readFileSync(join(output, "ui.tsx"), "utf8"), /^export function Helper/);
    assert.equal(readFileSync(join(output, "imports.txt"), "utf8"), "import Link from 'next/link';");
    const invalid = join(folder, "invalid-output");
    const failed = spawnSync(process.execPath, ["scripts/extract-page-parts.mjs", input, "ExamplePage", invalid, "missing marker"], { encoding: "utf8" });
    assert.notEqual(failed.status, 0);
    assert.equal(existsSync(invalid), false);
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
