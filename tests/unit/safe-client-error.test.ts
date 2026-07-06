import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Prisma } from "@prisma/client";
import {
  ClientSafeError,
  isInternalErrorMessage,
  safeClientMessage,
} from "../../src/lib/errors/client-safe-error";

describe("safe client error helpers", () => {
  it("returns explicit client-safe errors", () => {
    assert.equal(
      safeClientMessage(new ClientSafeError("Phone number is required."), "Fallback"),
      "Phone number is required.",
    );
  });

  it("hides prisma and infrastructure errors", () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Invalid `prisma.unit.findMany()`", {
      code: "P2021",
      clientVersion: "7.8.0",
    });

    assert.equal(
      safeClientMessage(prismaError, "Something went wrong."),
      "Something went wrong.",
    );
    assert.equal(
      safeClientMessage(new Error("connect ECONNREFUSED 127.0.0.1:5432"), "Unavailable"),
      "Unavailable",
    );
  });

  it("allows short validation-style messages", () => {
    assert.equal(
      safeClientMessage(new Error("Full name is too long."), "Failed"),
      "Full name is too long.",
    );
  });

  it("flags internal-looking messages", () => {
    assert.equal(isInternalErrorMessage("Invalid `prisma.tenant.create()` invocation"), true);
    assert.equal(isInternalErrorMessage("Tenant phone is required."), false);
  });
});