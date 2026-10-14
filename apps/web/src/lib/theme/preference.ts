export const THEME_STORAGE_KEY = "theme";
export const THEME_COOKIE_NAME = "estatedesk-theme";
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type ThemePreference = "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export function isThemePreference(
  value: string | null | undefined,
): value is ThemePreference {
  return value === "light" || value === "dark";
}

export function resolveTheme(theme: ThemePreference): ResolvedTheme {
  return theme;
}

export function getServerResolvedTheme(
  cookieValue: string | null | undefined,
): ResolvedTheme | null {
  if (cookieValue === "dark" || cookieValue === "light") {
    return cookieValue;
  }

  return null;
}

export function buildThemeCookie(theme: ThemePreference) {
  return `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export const THEME_INIT_SCRIPT = `(() => {
  try {
    const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    const cookieName = ${JSON.stringify(THEME_COOKIE_NAME)};
    const cookieMaxAge = ${THEME_COOKIE_MAX_AGE_SECONDS};
    const root = document.documentElement;
    const stored = window.localStorage.getItem(storageKey);
    const theme = stored === "dark" || stored === "light"
      ? stored
      : stored === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    const resolvedTheme = theme;
    window.localStorage.setItem(storageKey, theme);

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
    root.dataset.theme = theme;
    root.dataset.resolvedTheme = resolvedTheme;
    document.cookie =
      cookieName +
      "=" +
      theme +
      "; path=/; max-age=" +
      cookieMaxAge +
      "; SameSite=Lax";
  } catch {
    document.documentElement.classList.add("light");
    document.documentElement.style.colorScheme = "light";
  }
})();`;