"use client";

export function SkipToMain() {
  return (
    <a
      href="#main-content"
      onClick={(event) => {
        const main = Array.from(document.querySelectorAll<HTMLElement>("main")).find((element) => element.getClientRects().length > 0) ?? document.getElementById("main-content");
        if (main) { event.preventDefault(); main.tabIndex = -1; main.focus({ preventScroll: true }); main.scrollIntoView({ block: "start" }); }
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  );
}
