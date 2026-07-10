import { FileText } from "lucide-react";
import { receiptPublicUrl } from "../_lib/receipt-public-url";

export function ReceiptAttachmentLink({
  attachmentKey,
  label = "View receipt",
}: {
  attachmentKey?: string | null;
  label?: string;
}) {
  if (!attachmentKey) {
    return null;
  }

  const href = receiptPublicUrl(attachmentKey);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-xs font-semibold text-primary transition hover:bg-muted/20"
    >
      <FileText className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}