import { readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "playwright/test";

/** Navigate to a clean same-origin document so Next's dev runtime cannot reload fixtures. */
export async function setFixtureContent(page: Page, html: string) {
  const url = new URL(page.url());
  url.pathname = "/__ui-fixture";
  const documentUrl = new URL(url);
  documentUrl.hash = "";
  await page.route(documentUrl.toString(), route => route.fulfill({ contentType: "text/html", body: html }), { times: 1 });
  await page.goto(url.toString());
}

/** Fixtures load public CSS first; add the protected layout's authored styles explicitly. */
export async function installWorkspaceStyles(page: Page) {
  await page.evaluate(() => { document.body.dataset.workspaceTheme = "true"; });
  for (const file of ["workspace.css", "workspace-controls.css"]) {
    await page.addStyleTag({ content: readFileSync(path.resolve("apps/web/src/app/(app)", file), "utf8") });
  }
}
