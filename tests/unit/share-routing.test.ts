import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildShareDraftQuery,
  canCreateOrgIssue,
  resolveIssueCreatePath,
  resolveShareTargetPath,
} from "../../apps/web/src/lib/issues/share-routing";

describe("share routing", () => {
  it("builds shared draft query params for issue forms", () => {
    const query = buildShareDraftQuery({
      title: "Leaking sink",
      text: "Water under the kitchen cabinet.",
      url: "https://example.com/photo",
    });

    assert.match(query, /title=Leaking\+sink/);
    assert.match(query, /description=/);
    assert.match(query, /shared=1/);
  });

  it("routes authenticated office staff to the org issue draft form", () => {
    const path = resolveShareTargetPath({
      role: "MANAGER",
      isAuthenticated: true,
      shareInput: { title: "Broken gate", text: "Main entrance latch failed." },
    });

    assert.equal(path.startsWith("/dashboard/org/issues/new?"), true);
    assert.match(path, /shared=1/);
    assert.match(path, /title=Broken\+gate/);
  });

  it("routes caretakers and tenants to their issue forms", () => {
    assert.match(
      resolveShareTargetPath({
        role: "CARETAKER",
        isAuthenticated: true,
        shareInput: { title: "Pipe leak" },
      }),
      /^\/dashboard\/caretaker\/issues\/new\?/,
    );

    assert.match(
      resolveShareTargetPath({
        role: "TENANT",
        isAuthenticated: true,
        shareInput: { title: "No water" },
      }),
      /^\/dashboard\/tenant\/issues\/report\?/,
    );
  });

  it("resolves the legacy /issues/new alias by role", () => {
    assert.equal(
      resolveIssueCreatePath({
        role: "OFFICE",
        search: "?propertyId=prop_123",
      }),
      "/dashboard/org/issues/new?propertyId=prop_123",
    );

    assert.equal(
      resolveIssueCreatePath({
        role: "ACCOUNTANT",
        search: "?title=Leak",
      }),
      "/dashboard",
    );
  });

  it("identifies which org roles can create maintenance issues", () => {
    assert.equal(canCreateOrgIssue("ADMIN"), true);
    assert.equal(canCreateOrgIssue("MANAGER"), true);
    assert.equal(canCreateOrgIssue("OFFICE"), true);
    assert.equal(canCreateOrgIssue("ACCOUNTANT"), false);
    assert.equal(canCreateOrgIssue("CARETAKER"), false);
  });
});