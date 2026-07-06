import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const GLOBALS_CSS = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");

describe("theme coherence", () => {
  it("defines semantic page and card utilities", () => {
    assert.match(GLOBALS_CSS, /\.ed-theme-page\s*\{/);
    assert.match(GLOBALS_CSS, /\.ed-theme-card\s*\{/);
    assert.match(GLOBALS_CSS, /\.ed-theme-muted-panel\s*\{/);
    assert.match(GLOBALS_CSS, /\.ed-theme-band-inverse\s*\{/);
    assert.match(GLOBALS_CSS, /background-color:\s*var\(--background\)/);
    assert.match(GLOBALS_CSS, /color:\s*var\(--foreground\)/);
  });

  it("routes tenant dashboards through the shared theme shell", () => {
    const shell = readFileSync(
      join(ROOT, "src/components/theme/ed-dashboard-shell.tsx"),
      "utf8",
    );
    const lease = readFileSync(
      join(ROOT, "src/app/(app)/dashboard/tenant/lease/_components/lease-workspace.tsx"),
      "utf8",
    );
    const notices = readFileSync(
      join(ROOT, "src/app/(app)/dashboard/tenant/notices/page.tsx"),
      "utf8",
    );

    assert.match(shell, /ed-theme-card/);
    assert.match(shell, /ed-theme-muted-panel/);
    assert.match(lease, /PageShell/);
    assert.match(notices, /PageShell/);
    assert.doesNotMatch(lease, /bg-\[#fafafa\]/);
    assert.doesNotMatch(notices, /border-black\/5/);
  });

  it("maps legacy light surfaces and borders in dark mode", () => {
    assert.match(GLOBALS_CSS, /\.dark \[class\*="bg-\[#f5f5f7\]"\]/);
    assert.match(GLOBALS_CSS, /\.dark \[class\*="bg-\[#fafafa\]"\]/);
    assert.match(GLOBALS_CSS, /\.dark \.border-black\\\/5/);
    assert.match(GLOBALS_CSS, /\.dark \.border-black\\\/10/);
  });

  it("scopes dark-mode fixes to themed content shells", () => {
    assert.match(
      GLOBALS_CSS,
      /\.dark :where\(\.platform-theme-content, \.org-theme-content, \.ed-theme-page\)/
    );
    assert.match(GLOBALS_CSS, /\.border-black\\\/5, \.border-black\\\/10/);
  });

  it("uses CSS variables for SEO step panels in both themes", () => {
    assert.match(GLOBALS_CSS, /\.seo-steps-panel\s*\{/);
    assert.match(GLOBALS_CSS, /var\(--card\)/);
    assert.match(GLOBALS_CSS, /var\(--border\)/);
    assert.doesNotMatch(
      GLOBALS_CSS,
      /\.seo-step-card\s*\{[^}]*background:\s*#fff/i
    );
  });

  it("declares light color-scheme on html.light and :root", () => {
    assert.match(GLOBALS_CSS, /html\.light,\s*:root\s*\{[\s\S]*?color-scheme:\s*light/);
  });

  it("uses platform dark-mode classes on platform expenditures", () => {
    const workspace = readFileSync(
      join(ROOT, "src/app/(app)/platform/expenditures/_components/expenditures-workspace.tsx"),
      "utf8",
    );
    const helpers = readFileSync(
      join(ROOT, "src/app/(app)/platform/expenditures/_lib/helpers.ts"),
      "utf8",
    );

    assert.match(workspace, /PageHeader/);
    assert.match(workspace, /Surface/);
    assert.match(helpers, /dark:text-slate-100/);
    assert.match(helpers, /dark:bg-slate-900/);
    assert.doesNotMatch(helpers, /text-muted-foreground/);
  });

  it("uses platform dark-mode classes on audit logs", () => {
    const workspace = readFileSync(
      join(ROOT, "src/app/(app)/platform/audit-logs/_components/audit-logs-workspace.tsx"),
      "utf8",
    );
    const filters = readFileSync(
      join(ROOT, "src/app/(app)/platform/audit-logs/_components/audit-logs-filters.tsx"),
      "utf8",
    );

    assert.match(workspace, /PageHeader/);
    assert.match(workspace, /PaginationControls/);
    assert.match(filters, /dark:text-slate-100/);
    assert.match(filters, /dark:bg-slate-900/);
    assert.doesNotMatch(filters, /text-muted-foreground/);
  });
});