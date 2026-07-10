import type { OrgRole } from "@prisma/client";
import { BookOpen } from "lucide-react";
import { HoverPrefetchLink } from "@/components/navigation/app-links";
import { getInAppHelpHubPath, type HelpWorkspace } from "@/lib/help/help-workspace";

type InAppHelpNavProps = {
  workspace: HelpWorkspace;
  orgRole?: OrgRole | null;
  className?: string;
  compact?: boolean;
};

export function InAppHelpNav({
  workspace,
  className = "",
  compact = false,
}: InAppHelpNavProps) {
  return (
    <HoverPrefetchLink
      href={getInAppHelpHubPath(workspace)}
      className={[
        "flex w-full items-center gap-3 rounded-lg text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground",
        compact ? "px-3 py-2.5" : "px-4 py-3",
        className,
      ].join(" ")}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
        <BookOpen className="h-4 w-4" />
      </span>
      <span className="truncate">Help for your role</span>
    </HoverPrefetchLink>
  );
}