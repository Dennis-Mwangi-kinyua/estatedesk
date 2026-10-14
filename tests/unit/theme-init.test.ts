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
  isThemePreference,
} from "../../apps/web/src/lib/theme/preference";

const ROOT = join(import.meta.dirname, "..", "..");

describe("theme initialization", () => {
  it("supports only explicit light and dark preferences", () => {
    assert.equal(resolveTheme("dark"), "dark");
    assert.equal(resolveTheme("light"), "light");
    assert.equal(isThemePreference("system"), false);
    assert.equal(isThemePreference("light"), true);
    assert.equal(isThemePreference("dark"), true);
  });

  it("maps explicit theme cookies for server rendering", () => {
    assert.equal(getServerResolvedTheme("dark"), "dark");
    assert.equal(getServerResolvedTheme("light"), "light");
    assert.equal(getServerResolvedTheme("system"), null);
    assert.equal(getServerResolvedTheme(undefined), null);
  });

  it("builds a theme preference cookie", () => {
    assert.match(buildThemeCookie("dark"), new RegExp(`${THEME_COOKIE_NAME}=dark`));
    assert.match(buildThemeCookie("light"), /SameSite=Lax/);
  });

  it("applies the theme before paint without request-time root cookies", () => {
    const layout = readFileSync(join(ROOT, "apps/web/src/app/layout.tsx"), "utf8");
    const script = readFileSync(join(ROOT, "apps/web/public/theme-init.js"), "utf8");
    assert.match(layout, /id="estatedesk-theme-init" src="\/theme-init.js"/);
    assert.doesNotMatch(layout, /await cookies\(/);
    assert.match(script, /localStorage\.getItem/);
    assert.match(script, /classList\.add\(resolvedTheme\)/);
    assert.match(script, new RegExp(THEME_STORAGE_KEY));
    assert.match(THEME_INIT_SCRIPT, /classList\.add\(resolvedTheme\)/);
  });
});

it("migrates the old system setting once and persists only light or dark", async () => {
  const { runInNewContext } = await import("node:vm");
  for (const stored of ["system", "dark", "light", null]) {
    let preference = stored;
    const classes = new Set<string>();
    const root = { classList: { remove: (...values: string[]) => values.forEach(value => classes.delete(value)), add: (value: string) => classes.add(value) }, style: { colorScheme: "" }, dataset: {} as Record<string, string> };
    runInNewContext(THEME_INIT_SCRIPT, { window: { localStorage: { getItem: () => preference, setItem: (_key: string, value: string) => { preference = value; } }, matchMedia: () => ({ matches: true }) }, document: { documentElement: root, cookie: "" } });
    assert.equal(preference, stored === "system" || stored === "dark" ? "dark" : "light");
    assert.equal(root.dataset.theme, preference);
    assert.equal(classes.has(preference!), true);
  }
});
