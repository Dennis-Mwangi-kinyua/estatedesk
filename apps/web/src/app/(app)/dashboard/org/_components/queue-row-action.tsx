import Link from "@/components/navigation/workspace-link";
import { approveMeterReading } from "@/app/(app)/dashboard/org/notifications/actions";
import { sendPeriodBillReminderAction } from "@/app/(app)/dashboard/org/charges/bills/actions";
import type { OperatingItem } from "@/lib/workflow/operating-queue";

const actionClassName = "inline-flex min-h-11 shrink-0 items-center bg-transparent p-0 font-semibold text-primary";

export function QueueRowAction({ item, returnPath }: { item: OperatingItem; returnPath?: string }) {
  if (item.actionKind === "approve-reading" && item.actionFields?.readingId) {
    return (
      <form action={approveMeterReading}>
        <input type="hidden" name="readingId" value={item.actionFields.readingId} />
        <button className={actionClassName} type="submit">{item.action}</button>
      </form>
    );
  }
  if (item.actionKind === "send-reminder" && item.actionFields?.leaseId && item.actionFields.period) {
    return (
      <form action={sendPeriodBillReminderAction}>
        <input type="hidden" name="leaseId" value={item.actionFields.leaseId} />
        <input type="hidden" name="period" value={item.actionFields.period} />
        {returnPath ? <input type="hidden" name="returnTo" value={returnPath} /> : null}
        <button className={actionClassName} type="submit">{item.action}</button>
      </form>
    );
  }
  return <Link href={item.href} className={actionClassName}>{item.action}</Link>;
}

export function queueNoticeText(notice?: string) {
  if (notice === "reminder-sent") return "The balance was sent to the tenant.";
  if (notice === "reminder-already") return "This tenant already received today's reminder.";
  if (notice === "nothing-due") return "This bill has no balance to send.";
  return null;
}
