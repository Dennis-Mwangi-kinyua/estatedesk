import { expect, type Page } from "playwright/test";

/** Catch words split across lines, which a document overflow check cannot detect. */
export async function expectReadableWords(page: Page, selector: string) {
  const brokenWords = await page.locator(selector).evaluateAll((roots) => {
    const broken: string[] = [];
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || !parent.getClientRects().length || parent.closest("script, style, svg, [aria-hidden='true']")) continue;
        for (const match of (node.textContent ?? "").matchAll(/[A-Za-z]{6,}/g)) {
          const range = document.createRange();
          range.setStart(node, match.index!);
          range.setEnd(node, match.index! + match[0].length);
          const lines = new Set(Array.from(range.getClientRects()).filter(rect => rect.width > 0).map(rect => Math.round(rect.top)));
          if (lines.size > 1) broken.push(match[0]);
        }
      }
    }
    return broken;
  });
  expect(brokenWords, "Words should wrap at spaces, not between letters").toEqual([]);
}
