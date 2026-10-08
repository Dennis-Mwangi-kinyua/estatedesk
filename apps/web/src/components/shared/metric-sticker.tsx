import type { ComponentType } from "react";
import { WorkspaceIcon } from "./workspace-icon";

export function labelSticker(label: string) {
  return <WorkspaceIcon label={label} />;
}

export function MetricSticker({ label, icon: Icon }: { label?: string; icon?: ComponentType<{ className?: string }> }) {
  return <span aria-hidden="true" className="workspace-metric-sticker">{Icon ? <Icon className="h-5 w-5" /> : <WorkspaceIcon label={label ?? "overview"} />}</span>;
}

export { WorkspaceIdentity } from "./workspace-identity";
