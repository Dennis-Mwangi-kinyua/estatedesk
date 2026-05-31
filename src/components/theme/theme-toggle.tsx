"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Theme, useTheme } from "@/components/theme/theme-provider";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const label = "Change color theme";

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

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme[currentTheme])}
      className="ios-button ed-soft-button fixed right-[4.25rem] top-[max(1rem,env(safe-area-inset-top))] z-[140] inline-flex h-11 w-11 items-center justify-center border shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-xl transition print:hidden lg:bottom-4 lg:right-4 lg:top-auto"
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
