import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAccountCredentialsEmailHref,
  buildAccountCredentialsMessage,
  buildAccountCredentialsWhatsAppHref,
} from "../../apps/web/src/lib/notifications/account-credentials-message";

const sampleInput = {
  fullName: "Jane Wanjiku",
  username: "janewanjiku",
  password: "TempPass42",
  role: "TENANT",
  loginUrl: "https://app.estatedesk.com/login",
};

describe("account credentials share helpers", () => {
  it("builds a credential message with login details", () => {
    const message = buildAccountCredentialsMessage(sampleInput);

    assert.match(message, /Jane Wanjiku/);
    assert.match(message, /Username: janewanjiku/);
    assert.match(message, /Temporary password: TempPass42/);
    assert.match(message, /Login: https:\/\/app\.estatedesk\.com\/login/);
  });

  it("builds an email share link with recipient and encoded body", () => {
    const href = buildAccountCredentialsEmailHref(
      sampleInput,
      "jane@example.com",
    );

    assert.ok(href.startsWith("mailto:jane@example.com?"));
    assert.match(href, /subject=/);
    assert.match(href, /body=/);
    assert.match(decodeURIComponent(href), /janewanjiku/);
  });

  it("builds a WhatsApp share link for Kenya phone numbers", () => {
    const href = buildAccountCredentialsWhatsAppHref(sampleInput, "0712345678");

    assert.ok(href.startsWith("https://wa.me/254712345678?text="));
    assert.match(decodeURIComponent(href), /Temporary password: TempPass42/);
  });

  it("falls back to generic share links when contact details are missing", () => {
    const emailHref = buildAccountCredentialsEmailHref(sampleInput, null);
    const whatsappHref = buildAccountCredentialsWhatsAppHref(sampleInput, null);

    assert.ok(emailHref.startsWith("mailto:?"));
    assert.ok(whatsappHref.startsWith("https://wa.me/?text="));
  });
});