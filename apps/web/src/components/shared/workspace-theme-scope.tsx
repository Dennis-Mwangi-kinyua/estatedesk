"use client";

import { useEffect } from "react";

/** Keep portalled dialogs and menus in the signed-in action theme. */
export function WorkspaceThemeScope() {
  useEffect(() => {
    const previous = document.body.dataset.workspaceTheme;
    document.body.dataset.workspaceTheme = "true";
    return () => {
      if (previous === undefined) delete document.body.dataset.workspaceTheme;
      else document.body.dataset.workspaceTheme = previous;
    };
  }, []);
  return null;
}
