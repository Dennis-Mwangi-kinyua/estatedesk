import assert from "node:assert/strict";
import { it } from "node:test";
import { getDatabaseUrl } from "../../packages/config/src/env";
it("uses the pooled database URL for runtime and falls back to direct only when needed", () => {
  const database = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_URL;
  try {
    process.env.DATABASE_URL = "postgresql://user:pass@pooler.example/db?sslmode=require";
    process.env.DIRECT_URL = "postgresql://user:pass@direct.example/db?sslmode=require";
    const pooled = new URL(getDatabaseUrl());
    assert.equal(pooled.hostname, "pooler.example");
    assert.equal(pooled.searchParams.get("uselibpqcompat"), "true");
    delete process.env.DATABASE_URL;
    assert.equal(new URL(getDatabaseUrl()).hostname, "direct.example");
  } finally {
    if (database === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = database;
    if (direct === undefined) delete process.env.DIRECT_URL; else process.env.DIRECT_URL = direct;
  }
});
