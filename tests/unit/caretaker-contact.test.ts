import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contactHref } from "../../apps/web/src/app/(app)/dashboard/caretaker/_lib/contact";

describe("caretaker contact links", () => {
  it("builds Kenya WhatsApp deep links", () => {
    assert.equal(
      contactHref("whatsapp", "0712345678"),
      "https://wa.me/254712345678",
    );
  });

  it("keeps email and phone links intact", () => {
    assert.equal(contactHref("email", "caretaker@example.com"), "mailto:caretaker@example.com");
    assert.equal(contactHref("phone", "+254712345678"), "tel:+254712345678");
    assert.equal(contactHref("sms", "+254712345678"), "sms:+254712345678");
  });
});