import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ensurePdfFilename,
  isPdfBytes,
  isPdfLeaseAsset,
  sanitizeDownloadFilename,
  tenantLeaseDownloadPath,
} from "../../apps/web/src/app/(app)/dashboard/tenant/lease/_lib/download";

describe("tenant lease download helpers", () => {
  it("builds download and inline view paths", () => {
    assert.equal(
      tenantLeaseDownloadPath("lease_123"),
      "/dashboard/tenant/lease/lease_123/download",
    );
    assert.equal(
      tenantLeaseDownloadPath("lease_123", { view: true }),
      "/dashboard/tenant/lease/lease_123/download?view=1",
    );
  });

  it("sanitizes unsafe download filenames", () => {
    assert.equal(sanitizeDownloadFilename("  lease contract.pdf  "), "lease contract.pdf");
    assert.equal(sanitizeDownloadFilename("bad/name?.pdf"), "bad-name-.pdf");
    assert.equal(sanitizeDownloadFilename("   "), "lease-document.pdf");
  });

  it("detects pdf lease assets and normalizes filenames", () => {
    assert.equal(
      isPdfLeaseAsset({
        mimeType: "application/pdf",
        fileName: "lease.pdf",
      }),
      true,
    );
    assert.equal(
      isPdfLeaseAsset({
        mimeType: "image/png",
        fileName: "lease.png",
      }),
      false,
    );
    assert.equal(ensurePdfFilename("lease-contract"), "lease-contract.pdf");
    assert.equal(ensurePdfFilename("lease-contract.docx"), "lease-contract.pdf");
  });

  it("validates pdf byte signatures", () => {
    assert.equal(isPdfBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46])), true);
    assert.equal(isPdfBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47])), false);
  });
});