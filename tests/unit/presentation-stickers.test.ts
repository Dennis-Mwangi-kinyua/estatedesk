import assert from "node:assert/strict";
import { test } from "node:test";
import { stickerFor } from "../../apps/web/src/lib/presentation/stickers";
test("semantic stickers are stable and cover every workspace", () => {
  const cases = { "/dashboard/org/airbnb": "🛏️", "/dashboard/org/payments": "💳", "Water readings": "💧", "Tenant profile": "👋", "Maintenance": "🛠️", "Reports": "📊", "Security": "🔐", "Help": "💬" };
  for (const [label, emoji] of Object.entries(cases)) {
    assert.equal(stickerFor(label).emoji, emoji);
    assert.deepEqual(stickerFor(label), stickerFor(label.toUpperCase()));
  }
});
