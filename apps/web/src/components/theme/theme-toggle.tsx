"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTheme } from "@/components/theme/theme-provider";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function ThemeToggleButton({
  className,
  iconClassName = "h-5 w-5",
}: {
  className: string;
  iconClassName?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const isDark = isHydrated && resolvedTheme === "dark";
  const Icon = isDark ? Sun : Moon;
  const label = `Switch to ${isDark ? "light" : "dark"} mode`;

  return (
    <button data-workspace-action="true"
      type="button"
      disabled={!isHydrated}
      onClick={() => setTheme(isDark ? "light" : "dark")}
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
      className="ios-button ed-soft-button fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[140] hidden h-11 w-11 items-center justify-center border shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-xl transition print:hidden lg:inline-flex"
    />
  );
}
