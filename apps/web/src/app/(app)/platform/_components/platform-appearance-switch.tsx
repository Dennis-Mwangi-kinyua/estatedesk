"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTheme } from "@/components/theme/theme-provider";

export type PlatformAppearance = "classic" | "glass";
const STORAGE_KEY = "estatedesk-platform-appearance";
const CHANGE_EVENT = "estatedesk-platform-appearance-change";
let memoryPreference: PlatformAppearance = "classic";

function getSnapshot(): PlatformAppearance {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "classic" || stored === "glass" ? stored : memoryPreference;
  } catch {
    return memoryPreference;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function setPlatformAppearance(value: PlatformAppearance) {
  memoryPreference = value;
  try { window.localStorage.setItem(STORAGE_KEY, value); } catch { /* Keep the in-memory choice. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function usePlatformAppearance(isAdmin: boolean) {
  const appearance = useSyncExternalStore(subscribe, getSnapshot, () => "classic" as const);
  const { setThemeOverride } = useTheme();
  const isGlass = isAdmin && appearance === "glass";
  useEffect(() => {
    // A temporary rendering choice; never replace the saved Classic theme.
    setThemeOverride(isGlass ? "light" : null);
    return () => setThemeOverride(null);
  }, [isGlass, setThemeOverride]);
  return { appearance, isGlass };
}

export function PlatformAppearanceSwitch({ appearance }: { appearance: PlatformAppearance }) {
  return <div role="group" aria-label="Interface style" className="platform-appearance-switch inline-flex shrink-0 gap-1 rounded-xl border border-border p-1">
    {(["classic", "glass"] as const).map(value => <button
      key={value} type="button" data-workspace-action="true" aria-pressed={appearance === value}
      onClick={() => setPlatformAppearance(value)}
      className="min-h-9 rounded-lg px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >{value === "classic" ? "Classic" : "Glass"}</button>)}
  </div>;
}
