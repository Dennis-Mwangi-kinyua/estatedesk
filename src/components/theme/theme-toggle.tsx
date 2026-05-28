"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Theme, useTheme } from "@/components/theme/theme-provider";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const isDark = isHydrated && resolvedTheme === "dark";
  const currentTheme = isHydrated ? theme : "system";
  const nextTheme: Record<Theme, Theme> = {
    system: "light",
    light: "dark",
    dark: "system",
  };
  const Icon =
    currentTheme === "system" ? Monitor : isDark ? Sun : Moon;
  const label =
    currentTheme === "system"
      ? `Using system ${resolvedTheme} mode. Switch to light mode`
      : currentTheme === "light"
        ? "Using light mode. Switch to dark mode"
        : "Using dark mode. Switch to system mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme[currentTheme])}
      className="ios-button fixed bottom-4 right-4 z-[140] inline-flex h-11 w-11 items-center justify-center border border-neutral-200 bg-white/90 text-neutral-800 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-xl transition hover:bg-white dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-800 print:hidden"
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
