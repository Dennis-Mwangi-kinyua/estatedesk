import { TicketPriority, TicketStatus } from "@prisma/client";
import {
  getIssueSlaClassName,
  getIssueSlaState,
} from "@/lib/issues/sla";

export function IssueSlaBadge({
  createdAt,
  priority,
  status,
}: {
  createdAt: Date;
  priority: TicketPriority;
  status: TicketStatus;
}) {
  const sla = getIssueSlaState({ createdAt, priority, status });

  if (!sla) {
    return null;
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getIssueSlaClassName(
        sla.tone,
      )}`}
    >
      {sla.label}
    </span>
  );
}