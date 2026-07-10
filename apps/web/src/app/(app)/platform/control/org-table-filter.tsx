"use client";

import { useEffect } from "react";

/** Client-side filter for the control center organization table. */
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
        row.style.display = !q || hay.includes(q) ? "" : "none";
      });
    };

    input.addEventListener("input", onInput);
    return () => input.removeEventListener("input", onInput);
  }, []);

  return null;
}
