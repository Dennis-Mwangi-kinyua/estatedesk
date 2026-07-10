import "server-only";

export async function sendOwnerStatementEmail(input: {
  to: string;
  landlordName: string;
  orgName: string;
  periodLabel: string;
  netToOwner: string;
  pdfBytes: Uint8Array;
  filename: string;
}) {
  const subject = `${input.orgName} owner statement – ${input.periodLabel}`;
  const body = [
    `Dear ${input.landlordName},`,
    "",
    `Please find attached your owner statement for ${input.periodLabel}.`,
    "",
    `Net to owner: ${input.netToOwner}`,
    "",
    "This statement summarizes posted income, expenses, and distributions by property.",
    "",
    input.orgName,
    "Sent via EstateDesk Accounting",
  ].join("\n");

  // Replace with Resend, SendGrid, SES, or your provider of choice.
  if (process.env.NODE_ENV !== "production") {
    console.log("sendOwnerStatementEmail", {
      to: input.to,
      subject,
      filename: input.filename,
      pdfBytes: input.pdfBytes.length,
      preview: body,
    });
  }

  return {
    provider: "console",
    status: "sent" as const,
    attachmentBytes: input.pdfBytes.length,
  };
}