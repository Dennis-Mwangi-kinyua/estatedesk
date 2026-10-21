import "server-only";

import { sendTransactionalEmail } from "@/lib/notifications/email";

export async function sendApprovedDataExportEmail(input: {
  orgName: string;
  to: string;
  downloadUrl: string;
  expiresAt: Date | null;
}) {
  const expiryNotice = input.expiresAt
    ? `This link is valid until ${input.expiresAt.toISOString()} and can be used once.`
    : "This link can be used once.";
  await sendTransactionalEmail(
    input.to,
    `${input.orgName} organization data export`,
    `The platform approved the organization data export for ${input.orgName}. Sign in to your authorized EstateDesk organization account and use this secure download link: ${input.downloadUrl}\n\n${expiryNotice} Keep the downloaded file secure because it contains organization records.`,
  );
}
