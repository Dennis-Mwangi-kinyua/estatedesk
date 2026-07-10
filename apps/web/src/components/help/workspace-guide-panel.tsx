"use client";

import type { ReactNode } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
    <aside className={className}>
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(
              "group w-full overflow-hidden rounded-3xl border border-border bg-card p-4 text-left text-card-foreground shadow-sm transition hover:border-primary/25 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              triggerClassName,
            )}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground transition group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary">
                <BookOpen className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {eyebrow}
                </span>
                <span className="mt-1 block text-sm font-semibold text-foreground">
                  {title}
                </span>
                {description ? (
                  <span className="mt-1 block line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </span>
                ) : null}
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Open guide
                  <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </span>
            </div>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-lg">{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        </SheetContent>
      </Sheet>
    </aside>
  );
}