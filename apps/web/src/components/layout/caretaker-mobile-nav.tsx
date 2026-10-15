"use client";

import { CaretakerNavigation } from "./caretaker-navigation";
import { useNavigationDialog } from "@/components/navigation/use-navigation-dialog";

import { X } from "lucide-react";
import { LogOut } from "@/components/shared/colored-icons";
import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { logoutAction } from "@/features/auth/actions/logout-action";

type Props = {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
};

export function CaretakerMobileSidebar({
  open,
  onClose,
  returnFocusRef,
}: Props) {
  const pathname = usePathname();
  const hasMountedRef = useRef(false);
  const drawerRef = useRef<HTMLElement>(null);

  const handleClose = useCallback(() => {
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      drawerRef.current?.contains(active)
    ) {
      active.blur();
    }

    onClose();

    requestAnimationFrame(() => {
      returnFocusRef?.current?.focus({ preventScroll: true });
    });
  }, [onClose, returnFocusRef]);

  useNavigationDialog(open, drawerRef, handleClose, 1280);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    handleClose();
  }, [pathname, handleClose]);

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 xl:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      inert={!open ? true : undefined}
    >
      <button data-workspace-action="true"
        type="button"
        onClick={handleClose}
        aria-label="Close menu overlay"
        className={clsx(
          "workspace-navigation-backdrop absolute inset-0 bg-slate-950/25 backdrop-blur-md transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        ref={drawerRef}
        id="caretaker-mobile-drawer"
        data-caretaker-mobile-drawer
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-hidden={!open}
        tabIndex={-1}
        aria-label="Caretaker navigation"
        className={clsx(
          "ed-shell-panel absolute left-0 top-0 flex h-full w-[88%] max-w-[360px] flex-col border-r shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="shrink-0 border-b border-border px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  EstateDesk
                </p>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-xs font-medium text-muted-foreground">
                  Caretaker
                </span>
              </div>

              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Navigation
              </h2>

            </div>

            <button data-workspace-action="true"
              type="button"
              onClick={handleClose}
              aria-label="Close menu"
              className="ios-button ed-soft-button inline-flex h-11 w-11 shrink-0 items-center justify-center border shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <CaretakerNavigation mobile onNavigate={handleClose} />
        </div>

        <div className="shrink-0 border-t border-border px-3 py-4">
          <form data-logout-form action={logoutAction}>
            <button data-action-kind="destructive" data-workspace-action="true"
              type="submit"
              className="ios-button flex w-full items-center justify-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
