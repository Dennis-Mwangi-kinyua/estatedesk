import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");

function read(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("accessibility baseline", () => {
  it("respects reduced-motion preferences globally", () => {
    const css = read("src/app/globals.css");
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  });

  it("exposes a skip link and main landmark target", () => {
    const layout = read("src/app/layout.tsx");
    const skip = read("src/components/layout/skip-to-main.tsx");

    assert.match(layout, /SkipToMain/);
    assert.match(layout, /id="main-content"/);
    assert.match(skip, /href="#main-content"/);
  });

  it("keeps login fields labeled and password toggle announced", () => {
    const login = read("src/app/(auth)/login/LoginForm.tsx");

    assert.match(login, /htmlFor="email"/);
    assert.match(login, /id="email"/);
    assert.match(login, /htmlFor="password"/);
    assert.match(login, /id="password"/);
    assert.match(login, /aria-label=\{showPassword \? "Hide password" : "View password"\}/);
    assert.match(login, /role="alert"/);
  });

  it("uses focus-visible styles on shared buttons", () => {
    const button = read("src/components/ui/button.tsx");
    assert.match(button, /focus-visible:ring/);
  });

  it("documents the manual accessibility QA matrix", () => {
    assert.ok(existsSync(join(ROOT, "docs/ACCESSIBILITY_QA.md")));
    const qa = read("docs/ACCESSIBILITY_QA.md");
    assert.match(qa, /360px/);
    assert.match(qa, /\/dashboard\/org\/payments/);
    assert.match(qa, /\/dashboard\/tenant\/payments/);
    assert.match(qa, /\/dashboard\/caretaker\/issues/);
  });
});