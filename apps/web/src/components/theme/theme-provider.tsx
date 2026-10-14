"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  THEME_STORAGE_KEY,
  buildThemeCookie,
  isThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme/preference";

export type Theme = ThemePreference;

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const THEME_CLASSES: ResolvedTheme[] = ["light", "dark"];
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (isThemePreference(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage access failures in restricted browser contexts.
  }

  const initialized = document.documentElement.dataset.theme;
  return isThemePreference(initialized) ? initialized : "light";
}

function disableTransitionsTemporarily() {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none!important}",
    ),
  );
  document.head.appendChild(style);

  window.getComputedStyle(document.body);
  window.setTimeout(() => {
    document.head.removeChild(style);
  }, 1);
}

function applyTheme(theme: Theme, resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;

  root.classList.remove(...THEME_CLASSES);
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
  root.dataset.theme = theme;
  root.dataset.resolvedTheme = resolvedTheme;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);

    document.cookie = buildThemeCookie(theme);
  } catch {
    // Theme still applies even when storage is unavailable.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const resolvedTheme = theme;

  useEffect(() => {
    disableTransitionsTemporarily();
    applyTheme(theme, resolvedTheme);
  }, [resolvedTheme, theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}