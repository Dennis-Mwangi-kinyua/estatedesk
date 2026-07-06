import { TicketPriority, TicketStatus } from "@prisma/client";
import type { CaretakerLocale } from "@/app/(app)/dashboard/caretaker/_lib/i18n";

type HandoverOpenIssue = {
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  unit: {
    houseNo: string;
    property: { name: string };
  } | null;
};

const labels = {
  en: {
    empty:
      "Shift summary:\n- No open issues in my scope.\n- Completed work:\n- Follow-ups for next shift:\n",
    summary: "Shift summary:",
    openIssues: (count: number, urgent: number) =>
      `- Open issues in scope: ${count}${urgent > 0 ? ` (${urgent} urgent)` : ""}`,
    priorityQueue: "Priority queue:",
    line: (issue: HandoverOpenIssue) => {
      const location = issue.unit
        ? `${issue.unit.property.name} · Unit ${issue.unit.houseNo}`
        : "Unassigned unit";
      return `- [${issue.priority}] ${issue.title} (${location}) — ${issue.status.replaceAll("_", " ")}`;
    },
    completed: "Completed work:",
    followUps: "Follow-ups for next shift:",
    bullet: "- ",
  },
  sw: {
    empty:
      "Muhtasari wa zamu:\n- Hakuna matatizo wazi katika eneo langu.\n- Kazi iliyokamilika:\n- Ufuatiliaji kwa zamu inayofuata:\n",
    summary: "Muhtasari wa zamu:",
    openIssues: (count: number, urgent: number) =>
      `- Matatizo wazi katika eneo: ${count}${urgent > 0 ? ` (${urgent} ya dharura)` : ""}`,
    priorityQueue: "Foleni ya kipaumbele:",
    line: (issue: HandoverOpenIssue) => {
      const location = issue.unit
        ? `${issue.unit.property.name} · Chumba ${issue.unit.houseNo}`
        : "Chumba hakijapangwa";
      return `- [${issue.priority}] ${issue.title} (${location}) — ${issue.status.replaceAll("_", " ")}`;
    },
    completed: "Kazi iliyokamilika:",
    followUps: "Ufuatiliaji kwa zamu inayofuata:",
    bullet: "- ",
  },
} as const;

export function buildHandoverPrefill({
  locale,
  openIssues,
  urgentCount,
}: {
  locale: CaretakerLocale;
  openIssues: HandoverOpenIssue[];
  urgentCount: number;
}) {
  const copy = labels[locale];

  if (openIssues.length === 0) {
    return copy.empty;
  }

  return [
    copy.summary,
    copy.openIssues(openIssues.length, urgentCount),
    "",
    copy.priorityQueue,
    ...openIssues.map((issue) => copy.line(issue)),
    "",
    copy.completed,
    copy.bullet,
    "",
    copy.followUps,
    copy.bullet,
  ].join("\n");
}

export function buildHandoverPrefillByLocale(
  openIssues: HandoverOpenIssue[],
  urgentCount: number,
) {
  return {
    en: buildHandoverPrefill({ locale: "en", openIssues, urgentCount }),
    sw: buildHandoverPrefill({ locale: "sw", openIssues, urgentCount }),
  };
}