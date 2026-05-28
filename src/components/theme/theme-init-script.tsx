const THEME_INIT_SCRIPT = `
(() => {
  try {
    const storageKey = "theme";
    const root = document.documentElement;
    const stored = window.localStorage.getItem(storageKey);
    const theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const resolvedTheme = theme === "system" ? systemTheme : theme;

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
    root.dataset.theme = theme;
    root.dataset.resolvedTheme = resolvedTheme;
  } catch {
    document.documentElement.classList.add("light");
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
      suppressHydrationWarning
    />
  );
}
