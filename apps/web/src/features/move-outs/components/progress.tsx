import type { NoticeStatus } from "@prisma/client";
const stages = ["Notice submitted", "Inspection scheduled", "Inspection completed", "Handover confirmed", "Deposit settled"];
const current: Record<NoticeStatus, number> = { SUBMITTED: 0, INSPECTION_SCHEDULED: 1, INSPECTION_COMPLETED: 2, CLOSED: 3, CANCELLED: -1 };
export function MoveOutProgress({ status, closeout }: { status: NoticeStatus; closeout?: unknown }) {
  if (status === "CANCELLED") return <p className="text-xs text-muted-foreground">Notice withdrawn. The lease continues.</p>;
  const settled = closeout && typeof closeout === "object" && "refundStatus" in closeout && ["REFUNDED", "NOT_DUE"].includes(String(closeout.refundStatus));
  const stageIndex = status === "CLOSED" && settled ? 4 : current[status];
  return <ol aria-label="Move-out progress" className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-5 sm:text-xs">{stages.map((stage, index) => <li key={stage} aria-current={index === stageIndex ? "step" : undefined} className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 sm:px-3 ${index <= stageIndex ? "border-primary/30 bg-primary/5 text-foreground" : "border-border text-muted-foreground"}`}><span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${index <= stageIndex ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{index + 1}</span><span className="leading-4">{stage}</span></li>)}</ol>;
}
