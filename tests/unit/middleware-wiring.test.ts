import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");

describe("middleware wiring", () => {
  it("delegates to proxy security middleware", () => {
    const middleware = readFileSync(join(ROOT, "middleware.ts"), "utf8");
    const healthRoute = readFileSync(
      join(ROOT, "src/app/api/health/route.ts"),
      "utf8",
    );

    assert.match(middleware, /proxy as middleware/);
    assert.match(healthRoute, /isCronAuthorized\(request\)/);
  });
});