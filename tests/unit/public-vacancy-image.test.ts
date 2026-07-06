import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { publicVacancyImageUrl } from "../../src/lib/public-vacancy-image";

const originalPublicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
const originalBucket = process.env.S3_BUCKET;
const originalRegion = process.env.S3_REGION;

afterEach(() => {
  if (originalPublicBaseUrl === undefined) {
    delete process.env.S3_PUBLIC_BASE_URL;
  } else {
    process.env.S3_PUBLIC_BASE_URL = originalPublicBaseUrl;
  }

  if (originalBucket === undefined) {
    delete process.env.S3_BUCKET;
  } else {
    process.env.S3_BUCKET = originalBucket;
  }

  if (originalRegion === undefined) {
    delete process.env.S3_REGION;
  } else {
    process.env.S3_REGION = originalRegion;
  }
});

describe("public vacancy image URLs", () => {
  it("returns null for empty keys", () => {
    assert.equal(publicVacancyImageUrl(null), null);
    assert.equal(publicVacancyImageUrl(undefined), null);
    assert.equal(publicVacancyImageUrl(""), null);
  });

  it("keeps local and absolute URLs unchanged", () => {
    assert.equal(publicVacancyImageUrl("/uploads/vacancies/a.jpg"), "/uploads/vacancies/a.jpg");
    assert.equal(
      publicVacancyImageUrl("https://cdn.example.com/vacancies/a.jpg"),
      "https://cdn.example.com/vacancies/a.jpg",
    );
  });

  it("builds S3 URLs from configured public base URL", () => {
    process.env.S3_PUBLIC_BASE_URL = "https://cdn.estatedesk.co.ke/";
    assert.equal(
      publicVacancyImageUrl("vacancies/unit-a.jpg"),
      "https://cdn.estatedesk.co.ke/vacancies/unit-a.jpg",
    );
  });

  it("builds S3 URLs from bucket and region when no CDN base is set", () => {
    delete process.env.S3_PUBLIC_BASE_URL;
    process.env.S3_BUCKET = "estatedesk-media";
    process.env.S3_REGION = "af-south-1";

    assert.equal(
      publicVacancyImageUrl("vacancies/unit-b.jpg"),
      "https://estatedesk-media.s3.af-south-1.amazonaws.com/vacancies/unit-b.jpg",
    );
  });
});