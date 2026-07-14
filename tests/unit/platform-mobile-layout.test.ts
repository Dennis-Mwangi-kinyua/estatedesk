import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, it } from "node:test";

const ROOT = join(import.meta.dirname, "..", "..");
const PLATFORM_ROOT = join(
  ROOT,
  "apps/web/src/app/(app)/platform",
);

function read(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function filesBelow(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

describe("platform mobile layout", () => {
  it("keeps shared platform badges atomic", () => {
    const badgeSources = [
      read("apps/web/src/app/(app)/platform/_components/control-plane.tsx"),
      read("apps/web/src/app/(app)/platform/_components/platform-ui.tsx"),
      read("apps/web/src/app/(app)/platform/admins/_components/admins-ui.tsx"),
      read(
        "apps/web/src/app/(app)/platform/audit-logs/_components/audit-logs-shared.tsx",
      ),
    ];

    for (const source of badgeSources) {
      assert.match(source, /platform-badge/);
      assert.match(source, /shrink-0/);
      assert.match(source, /whitespace-nowrap/);
    }
  });

  it("does not rewrite authored mobile grids or compact form controls", () => {
    const css = read("apps/web/src/app/globals.css");

    assert.doesNotMatch(css, /\.grid\.grid-cols-3,[\s\S]*\.grid\.grid-cols-8/);
    assert.doesNotMatch(
      css,
      /\.grid\.sm\\:grid-cols-2, \.grid\.grid-cols-2/,
    );
    assert.match(css, /:not\(\[type="checkbox"\]\)/);
    assert.match(css, /:not\(\[type="radio"\]\)/);
    assert.match(css, /:not\(\[type="hidden"\]\)/);
  });

  it("standardizes phone action groups", () => {
    const css = read("apps/web/src/app/globals.css");
    const onboarding = read(
      "apps/web/src/app/(app)/platform/onboarding/page.tsx",
    );
    const messages = read(
      "apps/web/src/app/(app)/platform/messages/page.tsx",
    );

    assert.match(css, /\.platform-action-group \{/);
    assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
    assert.match(css, /\.platform-action-group > form > button/);
    assert.match(css, /\.platform-action-danger/);
    assert.match(onboarding, /platform-action-group/);
    assert.match(onboarding, /platform-action-danger/);
    assert.match(messages, /platform-action-group/);
    assert.match(messages, /platform-action-danger/);
  });

  it("pairs every platform table file with a mobile presentation", () => {
    const tableFiles = filesBelow(PLATFORM_ROOT).filter((path) => {
      if (![".tsx", ".jsx"].includes(extname(path))) return false;
      return readFileSync(path, "utf8").includes("<table");
    });

    assert.ok(tableFiles.length > 0);

    for (const path of tableFiles) {
      const source = readFileSync(path, "utf8");
      const hasMobileView =
        source.includes("ResponsiveDataList") ||
        source.includes("lg:hidden") ||
        source.includes("md:hidden");

      assert.equal(
        hasMobileView,
        true,
        `${path.slice(ROOT.length + 1)} needs a mobile table alternative`,
      );
    }
  });
});
