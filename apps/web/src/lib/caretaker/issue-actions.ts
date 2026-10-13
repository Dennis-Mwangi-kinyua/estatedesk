export function caretakerCanStartIssue(issue: { status: string; assignedToUserId: string | null }, userId: string) {
  return issue.status === "OPEN" && (!issue.assignedToUserId || issue.assignedToUserId === userId);
}
export function caretakerCanUpdateIssue(issue: { status: string; assignedToUserId: string | null }, userId: string) {
  return issue.status === "IN_PROGRESS" && issue.assignedToUserId === userId;
}

export function caretakerCanCompleteInspection(inspection: { status: string; inspectorUserId: string }, userId: string) {
  return inspection.status === "SCHEDULED" && inspection.inspectorUserId === userId;
}
