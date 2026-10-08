"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTheme } from "./theme-provider";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function HeaderThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const dark = mounted && resolvedTheme === "dark";
  const Icon = dark ? Sun : Moon;
  const label = `Switch to ${dark ? "light" : "dark"} mode`;
  return (
    <button type="button" className={`workspace-theme-toggle ${className}`} aria-label={label} title={label} disabled={!mounted} onClick={() => setTheme(dark ? "light" : "dark")}>
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  );
}
