import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { vacancyShareHref } from "../../apps/web/src/lib/vacancy-share";

describe("vacancyShareHref", () => {
  const url = "https://estatedesk.co.ke/vacancies/test-unit--abc123";
  const text = "Test property is vacant";

  it("builds WhatsApp share links", () => {
    assert.equal(
      vacancyShareHref("whatsapp", url, text),
      `https://wa.me/?text=${encodeURIComponent(text)}%20${encodeURIComponent(url)}`,
    );
  });

  it("builds Facebook share links", () => {
    assert.equal(
      vacancyShareHref("facebook", url, text),
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    );
  });

  it("builds X share links", () => {
    assert.equal(
      vacancyShareHref("x", url, text),
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    );
  });

  it("builds LinkedIn share links", () => {
    assert.equal(
      vacancyShareHref("linkedin", url, text),
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    );
  });
});