import Script from "next/script";
import { THEME_INIT_SCRIPT } from "@/lib/theme/preference";

export function ThemeInitScript() {
  return (
    <Script
      id="estatedesk-theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}