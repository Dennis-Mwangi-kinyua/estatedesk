import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateImageBytes } from "../../apps/web/src/lib/uploads/secure-image";

describe("secure image upload validation", () => {
  it("rejects HTML even when an attacker declares it as an image", () => {
    const html = Buffer.from("<html><script>alert('xss')</script></html>");
    assert.throws(() => validateImageBytes(html), /genuine JPEG, PNG, or WebP/);
  });

  it("rejects active SVG content", () => {
    const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
    assert.throws(() => validateImageBytes(svg), /genuine JPEG, PNG, or WebP/);
  });

  it("detects PNG content and assigns a server-controlled extension", () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    const image = validateImageBytes(png);
    assert.equal(image.mimeType, "image/png");
    assert.equal(image.extension, ".png");
    assert.equal(image.size, png.length);
  });
});
