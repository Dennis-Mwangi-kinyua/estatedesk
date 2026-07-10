"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  forcedModeForPath,
  getModeHome,
  isPlatformMode,
  lastPathStorageKey,
  PLATFORM_MODE_COOKIE_NAME,
  PLATFORM_MODE_STORAGE_KEY,
  resolvePlatformMode,
  type PlatformMode,
} from "../_lib/nav";

type PlatformModeContextValue = {
  mode: PlatformMode;
  preferredMode: PlatformMode;
  setPreferredMode: (mode: PlatformMode) => void;
  switchMode: (mode: PlatformMode) => void;
  getLastPath: (mode: PlatformMode) => string;
};

const PlatformModeContext = createContext<PlatformModeContextValue | null>(null);

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readPreferredMode(): PlatformMode {
  if (typeof window === "undefined") return "admin";
  try {
    const stored = window.localStorage.getItem(PLATFORM_MODE_STORAGE_KEY);
    if (isPlatformMode(stored)) return stored;
  } catch {
    // ignore
  }
  return "admin";
}

function readLastPath(mode: PlatformMode): string {
  if (typeof window === "undefined") return getModeHome(mode);
  try {
    const stored = window.localStorage.getItem(lastPathStorageKey(mode));
    if (stored && stored.startsWith("/platform")) return stored;
  } catch {
    // ignore
  }
  return getModeHome(mode);
}

function writePreferredMode(mode: PlatformMode) {
  try {
    window.localStorage.setItem(PLATFORM_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }

  const maxAge = 60 * 60 * 24 * 365;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${PLATFORM_MODE_COOKIE_NAME}=${mode}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  emit();
}

function writeLastPath(mode: PlatformMode, pathname: string) {
  if (!pathname.startsWith("/platform")) return;
  try {
    window.localStorage.setItem(lastPathStorageKey(mode), pathname);
  } catch {
    // ignore
  }
}

function getServerSnapshot(): PlatformMode {
  return "admin";
}

export function PlatformModeProvider({
  children,
  initialPreferredMode = "admin",
}: {
  children: ReactNode;
  initialPreferredMode?: PlatformMode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const preferredMode = useSyncExternalStore(
    subscribe,
    readPreferredMode,
    () => initialPreferredMode,
  );

  const forced = forcedModeForPath(pathname);
  const mode = resolvePlatformMode(pathname, preferredMode);

  // Keep preference in sync when visiting exclusive routes.
  useEffect(() => {
    if (forced && forced !== preferredMode) {
      writePreferredMode(forced);
    }
  }, [forced, preferredMode]);

  // Remember last path per active mode (including dual-mode pages).
  useEffect(() => {
    writeLastPath(mode, pathname);
  }, [mode, pathname]);

  const setPreferredMode = useCallback((next: PlatformMode) => {
    writePreferredMode(next);
  }, []);

  const getLastPath = useCallback((target: PlatformMode) => readLastPath(target), []);

  const switchMode = useCallback(
    (target: PlatformMode) => {
      writePreferredMode(target);
      const destination = readLastPath(target);
      if (destination !== pathname) {
        router.push(destination);
      }
    },
    [pathname, router],
  );

  // Keyboard shortcut: Alt+Shift+A (admin) / Alt+Shift+D (developer)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || !event.shiftKey) return;
      const key = event.key.toLowerCase();
      if (key === "a") {
        event.preventDefault();
        switchMode("admin");
      } else if (key === "d") {
        event.preventDefault();
        switchMode("developer");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [switchMode]);

  const value = useMemo<PlatformModeContextValue>(
    () => ({
      mode,
      preferredMode,
      setPreferredMode,
      switchMode,
      getLastPath,
    }),
    [mode, preferredMode, setPreferredMode, switchMode, getLastPath],
  );

  return (
    <PlatformModeContext.Provider value={value}>{children}</PlatformModeContext.Provider>
  );
}

export function usePlatformMode() {
  const ctx = useContext(PlatformModeContext);
  if (!ctx) {
    throw new Error("usePlatformMode must be used within PlatformModeProvider");
  }
  return ctx;
}
