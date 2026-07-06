"use client";

import { DeferredLink } from "@/components/navigation/app-links";
import {
  X,
  Home,
  Wrench,
  ClipboardList,
  FileText,
  Users,
  Droplets,
  Inbox,
  Bell,
  LogOut,
  ShieldCheck,
  UserRound,
  ListTodo,
  Building2,
  Search,
  Calendar,
  DoorOpen,
  FolderOpen,
  Megaphone,
  NotebookPen,
  Truck,
} from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { CARETAKER_NAV_ITEMS } from "@/app/(app)/dashboard/caretaker/_lib/i18n";
import { CaretakerNavLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-nav-label";

const navIcons = {
  "/dashboard/caretaker/today": ListTodo,
  "/dashboard/caretaker/search": Search,
  "/dashboard/caretaker/calendar": Calendar,
  "/dashboard/caretaker": Home,
  "/dashboard/caretaker/units": Building2,
  "/dashboard/caretaker/issues": Wrench,
  "/dashboard/caretaker/inspections": ClipboardList,
  "/dashboard/caretaker/move-outs": DoorOpen,
  "/dashboard/caretaker/leases": FileText,
  "/dashboard/caretaker/tenants": Users,
  "/dashboard/caretaker/water-bills": Droplets,
  "/dashboard/caretaker/documents": FolderOpen,
  "/dashboard/caretaker/broadcasts": Megaphone,
  "/dashboard/caretaker/handover": NotebookPen,
  "/dashboard/caretaker/vendors": Truck,
  "/dashboard/caretaker/finance-requests": Inbox,
  "/dashboard/caretaker/notifications": Bell,
  "/dashboard/caretaker/profile": UserRound,
  "/dashboard/caretaker/security": ShieldCheck,
} as const;

type Props = {
  fullName: string;
  open: boolean;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
};

export function CaretakerMobileSidebar({
  fullName,
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

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close menu overlay"
        className={clsx(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        ref={drawerRef}
        id="caretaker-mobile-drawer"
        data-caretaker-mobile-drawer
        role="dialog"
        aria-modal="true"
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

              <p className="mt-1 truncate text-sm text-muted-foreground">
                {fullName}
              </p>
            </div>

            <button
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
          <div className="mb-5 rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-xs font-medium text-muted-foreground">Workspace</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              Caretaker dashboard
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Access issues, inspections, tenants, leases, and billing in one
              organized workspace.
            </p>
          </div>

          <nav className="space-y-1.5">
            {CARETAKER_NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              const Icon = navIcons[item.href as keyof typeof navIcons] ?? Home;

              return (
                <DeferredLink
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition active:scale-[0.99]",
                    active ? "ed-nav-item-active" : "ed-nav-item",
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
                      active ? "ed-nav-icon-active" : "ed-nav-icon",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="truncate">
                    <CaretakerNavLabel labelKey={item.labelKey} />
                  </span>
                </DeferredLink>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 border-t border-border px-3 py-4">
          <form action={logoutAction}>
            <button
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