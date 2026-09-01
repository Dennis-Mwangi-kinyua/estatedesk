import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, it } from "node:test";

import { isDatabaseIndependentBuild } from "../../services/public-vacancy/src/build-mode";

const originalValue = process.env.ESTATEDESK_BUILD_WITHOUT_DATABASE;
const originalLifecycleEvent = process.env.npm_lifecycle_event;

afterEach(() => {
  if (originalValue === undefined) {
    delete process.env.ESTATEDESK_BUILD_WITHOUT_DATABASE;
  } else {
    process.env.ESTATEDESK_BUILD_WITHOUT_DATABASE = originalValue;
  }

  if (originalLifecycleEvent === undefined) {
    delete process.env.npm_lifecycle_event;
  } else {
    process.env.npm_lifecycle_event = originalLifecycleEvent;
  }
});

describe("database-independent production build", () => {
  it("is enabled only by the explicit build flag", () => {
    delete process.env.ESTATEDESK_BUILD_WITHOUT_DATABASE;
    assert.equal(isDatabaseIndependentBuild(), false);

    process.env.ESTATEDESK_BUILD_WITHOUT_DATABASE = "true";
    assert.equal(isDatabaseIndependentBuild(), false);

    process.env.npm_lifecycle_event = "build";
    assert.equal(isDatabaseIndependentBuild(), true);
  });

  it("short-circuits vacancy count and page reads", () => {
    const listings = readFileSync(
      resolve(process.cwd(), "services/public-vacancy/src/listings.ts"),
      "utf8",
    );

    assert.match(
      listings,
      /getVacancyListingsCountCached[\s\S]*isDatabaseIndependentBuild\(\)[\s\S]*Promise\.resolve\(0\)/,
    );
    assert.match(
      listings,
      /getVacancyListingsPageCached[\s\S]*isDatabaseIndependentBuild\(\)[\s\S]*items: \[\][\s\S]*total: 0/,
    );
  });
});
