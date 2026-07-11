"use client";

import { useEffect } from "react";

/**
 * Client-side filter for organization control cards (mobile) and table rows (desktop).
 * Targets any element with `.control-org-row` and `data-org-filter`.
 */
export function ControlOrgTableFilter() {
  useEffect(() => {
    const input = document.getElementById(
      "control-org-filter",
    ) as HTMLInputElement | null;
    if (!input) return;

    const onInput = () => {
      const q = input.value.trim().toLowerCase();
      document.querySelectorAll<HTMLElement>(".control-org-row").forEach((row) => {
        const hay = row.dataset.orgFilter ?? "";
        const match = !q || hay.includes(q);
        // Preserve default display for both <li> cards and <tr> rows.
        row.hidden = !match;
        row.style.display = match ? "" : "none";
      });
    };

    input.addEventListener("input", onInput);
    return () => input.removeEventListener("input", onInput);
  }, []);

  return null;
}
