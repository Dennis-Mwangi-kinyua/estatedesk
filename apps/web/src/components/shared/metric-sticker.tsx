import type { ComponentType } from "react";

export function labelSticker(label: string) {
  const text = label.toLowerCase();
  if (/water|meter|reading/.test(text)) return "💧";
  if (/issue|maintenance|repair/.test(text)) return "🛠️";
  if (/payment|rent|income|revenue|balance|billing|finance|collection|payout|expenditure/.test(text)) return "💳";
  if (/tenant|staff|employee|user|people|member/.test(text)) return "👥";
  if (/propert|organisation|organization|portfolio|building/.test(text)) return "🏘️";
  if (/unit|occupied|vacan|occupancy/.test(text)) return "🚪";
  if (/lease|document|export|report/.test(text)) return "📑";
  if (/notification|message|inbox|broadcast/.test(text)) return "💌";
  if (/key|security|permission/.test(text)) return "🔐";
  if (/inspection|task|job|queue|pending/.test(text)) return "📋";
  if (/complete|closed|resolved|success|verified/.test(text)) return "✅";
  if (/insight|overview|dashboard|summary/.test(text)) return "📊";
  return "📊";
}

export function MetricSticker({ label, icon: Icon }: { label?: string; icon?: ComponentType<{ className?: string }> }) {
  return <span aria-hidden="true" className="workspace-metric-sticker">{label ? labelSticker(label) : Icon ? <Icon className="h-5 w-5" /> : "📊"}</span>;
}

export { WorkspaceIdentity } from "./workspace-identity";
