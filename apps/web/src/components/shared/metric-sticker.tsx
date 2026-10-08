import type { ComponentType } from "react";
import { VisualSticker } from "./visual-sticker";

export function labelSticker(label: string) {
  return <VisualSticker label={label} size="xs" />;
}

export function MetricSticker({ label, icon: Icon }: { label?: string; icon?: ComponentType<{ className?: string }> }) {
  return <VisualSticker label={label ?? Icon?.displayName ?? "overview"} className="workspace-metric-sticker" />;
}

export { WorkspaceIdentity } from "./workspace-identity";
