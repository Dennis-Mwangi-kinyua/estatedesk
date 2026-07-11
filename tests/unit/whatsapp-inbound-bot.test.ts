import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWhatsappBotReply,
  detectWhatsappIntent,
  parseMetaWhatsappWebhook,
} from "../../apps/web/src/lib/whatsapp/inbound-bot";

describe("WhatsApp inbound chatbot", () => {
  it("detects menu and billing intents", () => {
    assert.equal(detectWhatsappIntent("hi"), "menu");
    assert.equal(detectWhatsappIntent("1"), "balance");
    assert.equal(detectWhatsappIntent("BALANCE please"), "balance");
    assert.equal(detectWhatsappIntent("pay mpesa"), "pay");
    assert.equal(detectWhatsappIntent("send receipt"), "receipt");
  });

  it("builds balance reply from tenant context", () => {
    const reply = buildWhatsappBotReply(
      { from: "254712345678", text: "balance" },
      {
        tenantName: "Jane",
        propertyName: "Greenview",
        unitLabel: "A1",
        period: "2026-07",
        balanceKes: 18500,
        rentBalanceKes: 15000,
        waterBalanceKes: 2000,
        serviceBalanceKes: 1500,
        portalUrl: "https://estatedesk.co.ke/dashboard/tenant",
      },
    );
    assert.equal(reply.intent, "balance");
    assert.match(reply.body, /18,500|18500/);
    assert.match(reply.body, /Water/);
  });

  it("parses Meta Cloud API webhook payloads", () => {
    const messages = parseMetaWhatsappWebhook({
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: "254700000000",
                    id: "wamid.1",
                    type: "text",
                    text: { body: "bill" },
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    assert.equal(messages.length, 1);
    assert.equal(messages[0].from, "254700000000");
    assert.equal(messages[0].text, "bill");
  });
});
