import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");

function readRobotsSource() {
  return readFileSync(join(ROOT, "apps/web/src/app/robots.ts"), "utf8");
}

describe("robots crawl policy", () => {
  it("blocks authenticated workspaces, API, and print routes", () => {
    const source = readRobotsSource();

    for (const path of [
      "/dashboard/",
      "/platform/",
      "/api/",
      "/print/",
      "/accept-invite/",
    ]) {
      assert.match(source, new RegExp(`"${path.replaceAll("/", "\\/")}"`));
    }
  });

  it("allows public discovery entry points", () => {
    const source = readRobotsSource();

    assert.match(source, /allow:\s*\[\s*"\/"/);
    assert.match(source, /"\/llms\.txt"/);
    assert.match(source, /sitemap-index\.xml/);
  });

  it("applies private-route disallow rules to major LLM crawlers", () => {
    const source = readRobotsSource();

    for (const agent of ["GPTBot", "Google-Extended", "CCBot"]) {
      assert.match(source, new RegExp(`userAgent:\\s*"${agent}"`));
    }
  });
});