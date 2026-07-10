"use client";

import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { WorkspaceDetailPanel } from "@/components/help/workspace-detail-panel";

export type WorkspaceGuidePanelProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  className?: string;
  triggerClassName?: string;
  children: ReactNode;
};

export function WorkspaceGuidePanel({
  title,
  description,
  eyebrow = "Workspace guide",
  className,
  triggerClassName,
  children,
}: WorkspaceGuidePanelProps) {
  return (
    <WorkspaceDetailPanel
      title={title}
      description={description}
      eyebrow={eyebrow}
      actionLabel="Open guide"
      icon={BookOpen}
      className={className}
      triggerClassName={triggerClassName}
    >
      {children}
    </WorkspaceDetailPanel>
  );
}