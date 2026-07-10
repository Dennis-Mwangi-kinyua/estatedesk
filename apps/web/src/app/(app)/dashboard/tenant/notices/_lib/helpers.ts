import type { NoticeStatus, NotificationStatus } from "@prisma/client";

export function getNotificationStatusClasses(status: NotificationStatus) {
  switch (status) {
    case "SENT":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "QUEUED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
  }
}

export function getMoveOutStatusClasses(status: NoticeStatus) {
  switch (status) {
    case "SUBMITTED":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "INSPECTION_SCHEDULED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "INSPECTION_COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CLOSED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "CANCELLED":
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
    default:
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
  }
}

export function getErrorMessage(error?: string) {
  switch (error) {
    case "missing_move_out_date":
      return "Please select your intended move-out date.";
    case "no_active_lease":
      return "You need an active lease to submit a move-out notice.";
    case "invalid_move_out_date":
      return "Move-out date must be today or later.";
    case "duplicate_open_notice":
      return "You already have an active move-out notice for this lease.";
    default:
      return null;
  }
}

export function getSuccessMessage(success?: string) {
  switch (success) {
    case "notice_submitted":
      return "Your move-out notice has been submitted successfully.";
    default:
      return null;
  }
}