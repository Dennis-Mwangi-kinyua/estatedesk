"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Theme, useTheme } from "@/components/theme/theme-provider";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const label = "Change color theme";

function ThemeToggleButton({
  className,
  iconClassName = "h-5 w-5",
}: {
  className: string;
  iconClassName?: string;
}) {
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
      className={className}
      aria-label={label}
      title={label}
    >
      <Icon className={iconClassName} />
    </button>
  );
}

export function HeaderThemeToggle({ className = "" }: { className?: string }) {
  return (
    <ThemeToggleButton
      className={[
        "ios-button ed-soft-button inline-flex h-10 w-10 shrink-0 items-center justify-center border shadow-sm backdrop-blur-xl transition print:hidden",
        className,
      ].join(" ")}
      iconClassName="h-[18px] w-[18px]"
    />
  );
}

export function ThemeToggle() {
  return (
    <ThemeToggleButton
      className="ios-button ed-soft-button fixed bottom-4 right-4 z-[140] hidden h-11 w-11 items-center justify-center border shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-xl transition print:hidden lg:inline-flex"
    />
  );
}
