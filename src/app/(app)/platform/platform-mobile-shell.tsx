"use client";

import Link from "next/link";
import { ReactNode, useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/features/auth/actions/logout-action";

type NavItem = {
  href: string;
  label: string;
  emoji: string;
};

export default function PlatformMobileShell({
  children,
  navItems,
  fullName,
}: {
  children: ReactNode;
  navItems: readonly NavItem[];
  fullName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-neutral-950">
              EstateDesk
            </h1>
            <p className="truncate text-xs text-neutral-500">
              Platform Administration
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls={panelId}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-900 transition hover:bg-neutral-100 active:scale-[0.98]"
          >
            <span className="text-lg leading-none">☰</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>

      <button
        type="button"
        aria-label="Close menu overlay"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id={panelId}
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 h-full w-[78%] max-w-[360px] border-l border-neutral-200 bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-tight text-neutral-950">
                Menu
              </h2>
              <p className="truncate text-xs text-neutral-500">{fullName}</p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-900 transition hover:bg-neutral-100 active:scale-[0.98]"
            >
              <span className="text-base leading-none">✕</span>
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-auto p-4">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "border-neutral-300 bg-neutral-100 text-neutral-950"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-base">
                    {item.emoji}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-neutral-200 p-4">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99]"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}