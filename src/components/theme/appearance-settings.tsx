"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTheme } from "@/components/theme/theme-provider";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const OPTIONS = [
  {
    value: "system",
    label: "System",
    description: "Follow this device",
    icon: Monitor,
  },
  {
    value: "light",
    label: "Light",
    description: "Always light",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always dark",
    icon: Moon,
  },
] as const;

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const currentTheme = isHydrated ? theme : "system";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/78 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/76">
      <div className="mb-3 px-1">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
          Appearance
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Choose how EstateDesk looks on this device.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = currentTheme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={active}
              className={[
                "ios-button flex min-h-20 items-center gap-3 rounded-2xl border px-3 text-left transition",
                active
                  ? "border-slate-950 bg-slate-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-950"
                  : "border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                  active
                    ? "bg-white/14 text-white dark:bg-slate-950/10 dark:text-slate-950"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {option.label}
                </span>
                <span
                  className={[
                    "mt-0.5 block text-xs",
                    active
                      ? "text-white/72 dark:text-slate-700"
                      : "text-slate-500 dark:text-slate-400",
                  ].join(" ")}
                >
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
