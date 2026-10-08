import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.(tsx?|css|html|svg)$/.test(file) ? [file] : [];
  });
}

test("site UI contains no decorative star or sparkle glyphs and icon components", () => {
  const forbidden = /[✨🌟⭐💫★☆✦✧✶✷✸✹✺✻✼✽❇❈]|\b(?:Star|Stars|Sparkle|Sparkles|WandSparkles|Wand2)(?:Icon)?\b/u;
  const violations = [...sourceFiles("apps/web/src"), ...sourceFiles("apps/web/public")].filter(file => forbidden.test(readFileSync(file, "utf8")));
  assert.deepEqual(violations, [], "Use a relevant interface icon instead of decorative stars or sparkles.");
});
