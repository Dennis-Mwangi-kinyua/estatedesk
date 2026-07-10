import { TicketPriority, TicketStatus } from "@prisma/client";

const VALID_STATUSES = new Set<string>(Object.values(TicketStatus));
const VALID_PRIORITIES = new Set<string>(Object.values(TicketPriority));

export function parseStatus(value: string | undefined) {
  if (!value) return null;

  const normalized = value.toUpperCase();

  return VALID_STATUSES.has(normalized)
    ? (normalized as TicketStatus)
    : null;
}

export function parsePriority(value: string | undefined) {
  if (!value) return null;

  const normalized = value.toUpperCase();

  return VALID_PRIORITIES.has(normalized)
    ? (normalized as TicketPriority)
    : null;
}

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  return date;
}

export function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export const ISSUES_LOAD_ERROR_MESSAGE =
  "We couldn't load issues right now. Please refresh the page or try again in a few minutes.";

export function getIssueBoardTitle({
  status,
  priority,
  range,
}: {
  status: TicketStatus | null;
  priority: TicketPriority | null;
  range: string;
}) {
  if (priority === TicketPriority.URGENT) {
    return "Urgent Cases";
  }

  if (status === TicketStatus.OPEN) {
    return "Open Issues";
  }

  if (status === TicketStatus.IN_PROGRESS) {
    return "In Progress Issues";
  }

  if (status === TicketStatus.RESOLVED && range === "today") {
    return "Resolved Today";
  }

  if (status === TicketStatus.RESOLVED) {
    return "Resolved Issues";
  }

  if (status === TicketStatus.CLOSED) {
    return "Closed Issues";
  }

  if (status === TicketStatus.CANCELLED) {
    return "Cancelled Issues";
  }

  return "Current Issues";
}

export function getIssueBoardDescription({
  status,
  priority,
  range,
}: {
  status: TicketStatus | null;
  priority: TicketPriority | null;
  range: string;
}) {
  if (priority === TicketPriority.URGENT) {
    return "High-priority issues that need immediate attention.";
  }

  if (status === TicketStatus.OPEN) {
    return "Issues awaiting review, assignment, or action.";
  }

  if (status === TicketStatus.IN_PROGRESS) {
    return "Issues currently being handled by staff or caretakers.";
  }

  if (status === TicketStatus.RESOLVED && range === "today") {
    return "Issues resolved within today's workflow.";
  }

  if (status === TicketStatus.RESOLVED) {
    return "Issues marked as resolved.";
  }

  return "Track maintenance and operational issues in one workspace.";
}

export function getStatusClass(status: TicketStatus) {
  if (status === TicketStatus.OPEN) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
  }

  if (status === TicketStatus.IN_PROGRESS) {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200";
  }

  if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
  }

  return "border-border bg-muted/20 text-muted-foreground";
}

export function buildIssuesPageHref(
  page: number,
  filters: {
    status?: string | null;
    priority?: string | null;
    range?: string;
  } = {},
) {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.priority) {
    params.set("priority", filters.priority);
  }

  if (filters.range) {
    params.set("range", filters.range);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const qs = params.toString();
  return qs ? `/dashboard/caretaker/issues?${qs}` : "/dashboard/caretaker/issues";
}

export function getPriorityClass(priority: TicketPriority) {
  if (priority === TicketPriority.URGENT) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200";
  }

  if (priority === TicketPriority.HIGH) {
    return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200";
  }

  if (priority === TicketPriority.MEDIUM) {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200";
  }

  return "border-border bg-muted/20 text-muted-foreground";
}