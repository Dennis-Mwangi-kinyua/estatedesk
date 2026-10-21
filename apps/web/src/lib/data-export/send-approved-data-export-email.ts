import "server-only";

import { sendTransactionalEmail } from "@/lib/notifications/email";
import { buildOrganizationCsvZip } from "@/lib/data-export/org-export";

export async function sendApprovedDataExportEmail(input: {
  orgId: string;
  orgName: string;
  to: string;
}) {
  const archive = await buildOrganizationCsvZip(input.orgId);
  const bytes = Buffer.from(archive.zip);
  await sendTransactionalEmail(
    input.to,
    `${input.orgName} organization data export`,
    `The approved CSV archive for ${input.orgName} is attached. Keep this file secure because it contains organization records.`,
    [{ filename: archive.fileName, content: bytes.toString("base64") }],
  );
  return { fileName: archive.fileName, byteLength: bytes.byteLength };
}
