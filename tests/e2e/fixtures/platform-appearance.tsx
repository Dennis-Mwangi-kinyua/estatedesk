import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "../../../apps/web/src/components/theme/theme-provider";
import { HeaderThemeToggle } from "../../../apps/web/src/components/theme/workspace-theme-toggle";

function Admin() {
  return <div className="platform-shell-admin">
    <HeaderThemeToggle />
    <article id="appearance-panel" className="platform-glass-panel bg-card text-card-foreground">Example panel</article>
  </div>;
}

function App() {
  const [onPlatform, setOnPlatform] = useState(true);
  return <ThemeProvider><div className="estate-workspace">
    <button onClick={() => setOnPlatform(false)}>Leave platform</button>
    {onPlatform ? <Admin /> : <p>Other workspace</p>}
  </div></ThemeProvider>;
}
createRoot(document.getElementById("root")!).render(<App />);
