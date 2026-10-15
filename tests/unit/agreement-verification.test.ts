import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { agreementIntegrity, agreementVerificationPath } from "../../apps/web/src/lib/service-agreements/verification";
import type { AgreementData } from "../../apps/web/src/lib/service-agreements/contract";
import { createProfessionalPdf } from "../../apps/web/src/lib/documents/professional-pdf";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";
const hash = (body: string | Buffer) => createHash("sha256").update(body).digest("hex");

test("agreement text, signed text references, and signature image hashes must agree", () => {
  const body = "Previously signed agreement text";
  const contentHash = hash(body);
  const signature = {name:"Signer",userId:"test",signedAt:"2026-10-15T00:00:00.000Z",contentHash};
  const data: AgreementData = {body,templateVersion:"previous",representative:"Test",organizationSignature:signature,platformSignature:signature};
  assert.equal(agreementIntegrity(data,contentHash),true);
  assert.equal(agreementIntegrity({...data,body:"Changed"},contentHash),false);
  assert.equal(agreementIntegrity({...data,platformSignature:{...signature,contentHash:"different"}},contentHash),false);
  const bytes = Buffer.from("test image bytes");
  const drawn = {...signature,imageData:`data:image/png;base64,${bytes.toString("base64")}`,imageHash:hash(bytes)};
  assert.equal(agreementIntegrity({...data,organizationSignature:drawn},contentHash),true);
  assert.equal(agreementIntegrity({...data,organizationSignature:{...drawn,imageHash:"tampered"}},contentHash),false);
  assert.equal(agreementIntegrity({...data,organizationSignature:{...signature,method:"DRAWN"}},contentHash),false);
  assert.equal(agreementIntegrity(data,null),false);
});
test("verification QR points to a private hash-bound registry page and embeds into PDF", async () => {
  const path = agreementVerificationPath("a".repeat(48),"b".repeat(64));
  assert.equal(path, `/agreements/verify/${"a".repeat(48)}?hash=${"b".repeat(64)}`);
  const pdf = await createProfessionalPdf({title:"DPA",serialNumber:"TEST",organizationName:"Test",issuedAt:new Date(),verificationUrl:`https://estatedesk.co.ke${path}`});
  await pdf.verification("Scan to verify the registered signed agreement.");
  const bytes = await pdf.save();
  assert.ok(Buffer.from(bytes).toString("latin1").includes("/Subtype /Image"));
  assert.equal((await PDFDocument.load(bytes)).getPageCount(),1);
});
test("verification pages are available to platform admins and organization admins only", () => {
  const path = `/agreements/verify/${"a".repeat(48)}`;
  for (const role of ["ADMIN","MANAGER","TENANT","CARETAKER"] as const) assert.equal(canAccessWorkspacePath({platformRole:"USER",activeOrgRole:role,activeOrgId:"org"},path),role==="ADMIN");
  assert.equal(canAccessWorkspacePath({platformRole:"PLATFORM_ADMIN",activeOrgRole:null,activeOrgId:null},path),true);
});
