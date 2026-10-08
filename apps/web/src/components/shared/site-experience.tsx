"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const pageIcons: Array<[RegExp, string]> = [
  [/tenant|resident/, "👋"], [/propert|building|unit|vacanc/, "🏘️"],
  [/lease|agreement|document|invoice/, "📄"], [/payment|billing|rent|tax|finance|expense|budget/, "💳"],
  [/issue|maintenance|inspection|task/, "🛠️"], [/report|analytic|statement/, "📊"],
  [/profile|staff|team|user|agent|landlord/, "👤"], [/setting|security|integration|api/, "⚙️"],
  [/help|guide|faq|support|contact/, "💬"], [/login|register|password|invite/, "🔐"],
];

/** Adds presentation metadata without replacing controls, content, or table structure. */
export function SiteExperience() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname?.startsWith("/print")) return;
    const root = document.getElementById("main-content");
    if (!root) return;
    let frame = 0;
    const enhance = () => {
      const heading = root.querySelector<HTMLElement>("h1");
      if (heading?.dataset.headingIcon === "custom") delete heading.dataset.pageIcon;
      if (heading && heading.dataset.headingIcon !== "custom" && !heading.querySelector(".workspace-page-marker") && !/\p{Extended_Pictographic}/u.test(heading.textContent ?? "")) {
        heading.dataset.pageIcon = pageIcons.find(([pattern]) => pattern.test(pathname ?? ""))?.[1] ?? "📋";
      }
      root.querySelectorAll<HTMLTableElement>("table").forEach(table => {
        const headerRows = table.tHead?.rows;
        if (!headerRows || headerRows.length !== 1 || table.dataset.tableLayout === "comparison" || table.tFoot) return;
        const headers = Array.from(headerRows[0].cells);
        if (!headers.length || headers.some(cell => cell.colSpan > 1 || cell.rowSpan > 1)) return;
        const rows = Array.from(table.tBodies).flatMap(body => Array.from(body.rows));
        // Complex matrix and grouped tables retain their authored layout.
        if (rows.some(row => row.cells.length > 1 && (row.cells.length !== headers.length || Array.from(row.cells).some(cell => cell.colSpan > 1 || cell.rowSpan > 1)))) { delete table.dataset.mobileCards; return; }
        table.dataset.mobileCards = "true";
        if (!table.hasAttribute("role")) table.setAttribute("role", "table");
        Array.from(table.rows).forEach(row => {
          if (!row.hasAttribute("role")) row.setAttribute("role", "row");
        });
        headers.forEach(header => {
          if (!header.hasAttribute("scope")) header.scope = "col";
          if (!header.hasAttribute("role")) header.setAttribute("role", "columnheader");
        });
        rows.forEach(row => {
          const full = row.cells.length === 1 && headers.length > 1;
          row.dataset.fullWidth = String(full);
          Array.from(row.cells).forEach((cell, index) => {
            if (!cell.hasAttribute("role")) cell.setAttribute("role", "cell");
            cell.dataset.columnLabel = full ? "" : (headers[index]?.textContent?.replace(/\s+/g, " ").trim() || headers[index]?.getAttribute("aria-label") || "Actions");
          });
        });
      });
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; enhance(); });
    };
    enhance();
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, [pathname]);
  return null;
}
