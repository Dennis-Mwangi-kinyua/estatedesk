import { readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "playwright/test";

/** Fixtures load public CSS first; add the protected layout's authored styles explicitly. */
export async function installWorkspaceStyles(page: Page) {
  await page.evaluate(() => { document.body.dataset.workspaceTheme = "true"; });
  for (const file of ["workspace.css", "workspace-controls.css"]) {
    await page.addStyleTag({ content: readFileSync(path.resolve("apps/web/src/app/(app)", file), "utf8") });
  }
}
