export function buildDataExportAlertEmail(input: {
  organizationName: string;
  requesterName: string;
  requesterEmail: string | null;
  reason: string;
  deliveryMethod: "DOWNLOAD" | "EMAIL";
  deliveryEmail: string | null;
  requestedAt: Date;
  reviewUrl: string;
}) {
  return {
    subject: `CSV export request: ${input.organizationName}`,
    text: [
      "A new organization CSV export request is waiting for platform review.",
      "",
      `Organization: ${input.organizationName}`,
      `Requested by: ${input.requesterName}${input.requesterEmail ? ` (${input.requesterEmail})` : ""}`,
      `Requested at: ${input.requestedAt.toISOString()}`,
      `Requested delivery: ${input.deliveryMethod === "EMAIL" ? `Email to ${input.deliveryEmail ?? "address not provided"}` : "Secure in-app download"}`,
      "",
      "Reason:",
      input.reason,
      "",
      `Review the request: ${input.reviewUrl}`,
    ].join("\n"),
  };
}
