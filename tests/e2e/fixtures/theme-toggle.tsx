import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "../../../apps/web/src/components/theme/theme-provider";
import { HeaderThemeToggle as PublicToggle } from "../../../apps/web/src/components/theme/theme-toggle";
import { HeaderThemeToggle as WorkspaceToggle } from "../../../apps/web/src/components/theme/workspace-theme-toggle";

createRoot(document.getElementById("root")!).render(<ThemeProvider>
  <div id="public-toggle"><PublicToggle /></div>
  <div className="estate-workspace" id="workspace-toggle"><WorkspaceToggle /></div>
</ThemeProvider>);
