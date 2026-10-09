import type { NoticeStatus } from "@prisma/client";
const stages = ["Notice submitted", "Inspection scheduled", "Inspection completed", "Handover confirmed", "Deposit settled"];
const current: Record<NoticeStatus, number> = { SUBMITTED: 0, INSPECTION_SCHEDULED: 1, INSPECTION_COMPLETED: 2, CLOSED: 3, CANCELLED: -1 };
export function MoveOutProgress({ status, closeout }: { status: NoticeStatus; closeout?: unknown }) {
  if (status === "CANCELLED") return <p className="text-xs text-muted-foreground">Notice withdrawn. The lease continues.</p>;
  const settled = closeout && typeof closeout === "object" && "refundStatus" in closeout && ["REFUNDED", "NOT_DUE"].includes(String(closeout.refundStatus));
  const stageIndex = status === "CLOSED" && settled ? 4 : current[status];
  return <ol aria-label="Move-out progress" className="grid gap-2 text-xs sm:grid-cols-5">{stages.map((stage, index) => <li key={stage} aria-current={index === stageIndex ? "step" : undefined} className={`rounded-xl border px-3 py-2 ${index <= stageIndex ? "border-primary/30 bg-primary/5 text-foreground" : "border-border text-muted-foreground"}`}>{index + 1}. {stage}</li>)}</ol>;
}
