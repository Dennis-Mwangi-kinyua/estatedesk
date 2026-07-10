import type { AccountingRequestStatus } from "@prisma/client";
import { statusLabel, statusTone } from "../_lib/helpers";

export function RequestStatusBadge({ status }: { status: AccountingRequestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${statusTone(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}