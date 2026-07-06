import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";
import {
  THEME_COOKIE_NAME,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  buildThemeCookie,
  getServerResolvedTheme,
  resolveTheme,
} from "../../src/lib/theme/preference";

const ROOT = join(import.meta.dirname, "..", "..");

describe("theme initialization", () => {
  it("resolves explicit and system preferences", () => {
    assert.equal(resolveTheme("dark"), "dark");
    assert.equal(resolveTheme("light"), "light");
    assert.equal(resolveTheme("system", true), "dark");
    assert.equal(resolveTheme("system", false), "light");
  });

  it("maps explicit theme cookies for server rendering", () => {
    assert.equal(getServerResolvedTheme("dark"), "dark");
    assert.equal(getServerResolvedTheme("light"), "light");
    assert.equal(getServerResolvedTheme("system"), null);
    assert.equal(getServerResolvedTheme(undefined), null);
  });

  it("builds a theme preference cookie", () => {
    assert.match(buildThemeCookie("dark"), new RegExp(`${THEME_COOKIE_NAME}=dark`));
    assert.match(buildThemeCookie("system"), /SameSite=Lax/);
  });

  it("loads theme init before interaction via next/script", () => {
    const initScript = readFileSync(
      join(ROOT, "src/components/theme/theme-init-script.tsx"),
      "utf8",
    );
    const layout = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");

    assert.match(initScript, /from "next\/script"/);
    assert.match(initScript, /strategy="beforeInteractive"/);
    assert.match(initScript, /dangerouslySetInnerHTML/);
    assert.doesNotMatch(initScript, /<script[\s>]/);
    assert.match(THEME_INIT_SCRIPT, /localStorage\.getItem/);
    assert.match(THEME_INIT_SCRIPT, /classList\.add\(resolvedTheme\)/);
    assert.match(layout, /getServerResolvedTheme/);
    assert.match(layout, /THEME_COOKIE_NAME/);
    assert.match(layout, new RegExp(THEME_STORAGE_KEY));
  });
});