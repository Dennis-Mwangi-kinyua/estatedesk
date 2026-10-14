(() => {
  try {
    const storageKey = "theme";
    const cookieName = "estatedesk-theme";
    const cookieMaxAge = 31536000;
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
})();
(function(){try{var standalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;if(standalone){document.documentElement.dataset.pwaLaunch="visible";document.documentElement.dataset.pwaLaunchStartedAt=String(performance.now());var dark=document.documentElement.classList.contains("dark");var color=dark?"#020617":"#f8fafc";document.querySelectorAll('meta[name="theme-color"]').forEach(function(meta){meta.setAttribute("content",color)})}}catch{}})();
