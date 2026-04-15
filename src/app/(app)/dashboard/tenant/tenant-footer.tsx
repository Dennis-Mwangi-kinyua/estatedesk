"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineHomeModern, HiOutlineShieldCheck } from "react-icons/hi2";

export function TenantFooter() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 20) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-2 z-40 px-3 transition-all duration-300 ease-out lg:hidden ${
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-sm rounded-[24px] border border-white/60 bg-white/78 px-3 py-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur-2xl ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm">
                  <HiOutlineHomeModern className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold tracking-tight text-neutral-900">
                    EstateDesk
                  </p>
                  <p className="truncate text-[10px] text-neutral-500">
                    Secure mobile access
                  </p>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
              <HiOutlineShieldCheck className="h-3.5 w-3.5" />
              Secure
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-30 hidden border-t border-neutral-200/80 bg-white/95 backdrop-blur-xl lg:block lg:left-[300px] xl:left-[320px]">
        <div className="px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-tight text-neutral-900">
                EstateDesk
              </p>
              <p className="text-[11px] text-neutral-500">
                Secure tenant access
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-neutral-500">
              <span>© 2026 EstateDesk</span>
              <span className="text-neutral-300">•</span>
              <span>Privacy-first</span>
              <span className="text-neutral-300">•</span>
              <span>Fast support</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}