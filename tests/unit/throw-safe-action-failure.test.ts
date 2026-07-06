import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Prisma } from "@prisma/client";
import { ClientSafeError } from "../../src/lib/errors/client-safe-error";
import { throwSafeActionFailure } from "../../src/lib/errors/throw-safe-action-failure";

describe("throwSafeActionFailure", () => {
  it("rethrows client-safe validation errors", () => {
    assert.throws(
      () =>
        throwSafeActionFailure(
          "test",
          new ClientSafeError("Phone number is required."),
          "Fallback",
        ),
      (error: unknown) =>
        error instanceof ClientSafeError &&
        error.message === "Phone number is required.",
    );
  });

  it("masks prisma failures with a generic message", () => {
    assert.throws(
      () =>
        throwSafeActionFailure(
          "test",
          new Prisma.PrismaClientKnownRequestError("Invalid `prisma.unit.findMany()`", {
            code: "P2021",
            clientVersion: "7.8.0",
          }),
          "Could not complete the action.",
        ),
      (error: unknown) =>
        error instanceof ClientSafeError &&
        error.message === "Could not complete the action.",
    );
  });
});