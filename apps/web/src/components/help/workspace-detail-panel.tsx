"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { BookOpen, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkspaceDetailPanelProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actionLabel?: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
  triggerClassName?: string;
  children: ReactNode;
};

export function WorkspaceDetailPanel({
  title,
  description,
  eyebrow = "Workspace guide",
  actionLabel = "Open guide",
  icon: Icon = BookOpen,
  className,
  triggerClassName,
  children,
}: WorkspaceDetailPanelProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  // Client-only portal host (SSR false, client true) without setState-in-effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  const drawer =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[200] flex justify-end">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close panel"
              onClick={close}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descriptionId : undefined}
              className="workspace-detail-drawer relative z-[201] flex h-dvh max-h-dvh w-full max-w-xl flex-col border-l border-border bg-popover text-popover-foreground shadow-2xl"
            >
              <header className="shrink-0 border-b border-border px-5 py-4 pr-14">
                <h2 id={titleId} className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
                {description ? (
                  <p
                    id={descriptionId}
                    className="mt-1 text-sm leading-6 text-muted-foreground"
                  >
                    {description}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div
                data-workspace-drawer-scroll
                className="workspace-detail-drawer-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4"
              >
                <div className="space-y-4 pb-8">{children}</div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <aside className={className}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "group w-full overflow-hidden rounded-3xl border border-border bg-card p-4 text-left text-card-foreground shadow-sm transition hover:border-primary/25 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            triggerClassName,
          )}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground transition group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary">
              <Icon className="h-4 w-4" />
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
                {actionLabel}
                <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </span>
          </div>
        </button>
      </aside>
      {drawer}
    </>
  );
}