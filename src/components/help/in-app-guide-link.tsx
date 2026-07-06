import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { BookOpen } from "lucide-react";
import {
  canAccessGuideTopic,
  getInAppGuideTopic,
  type InAppGuideTopic,
} from "@/lib/help/in-app-guides";
import {
  getInAppHelpArticlePath,
  type HelpWorkspace,
} from "@/lib/help/help-workspace";

type InAppGuideLinkProps = {
  topic: InAppGuideTopic;
  workspace: HelpWorkspace;
  orgRole?: OrgRole | null;
  className?: string;
  variant?: "inline" | "card";
};

export function InAppGuideLink({
  topic,
  workspace,
  orgRole,
  className = "",
  variant = "inline",
}: InAppGuideLinkProps) {
  if (!canAccessGuideTopic(topic, workspace, orgRole)) {
    return null;
  }

  const guide = getInAppGuideTopic(topic);
  const href = getInAppHelpArticlePath(workspace, guide.slug);

  if (variant === "card") {
    return (
      <Link
        href={href}
        className={[
          "inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/60",
          className,
        ].join(" ")}
      >
        <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span>{guide.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground",
        className,
      ].join(" ")}
    >
      <BookOpen className="h-3.5 w-3.5 shrink-0" />
      <span>{guide.label}</span>
    </Link>
  );
}