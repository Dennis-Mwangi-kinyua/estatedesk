import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSitemapIndexEntry,
  buildUrlEntry,
  formatDate,
  gzipXml,
  wrapSitemapIndex,
  wrapUrlset,
  xmlEscape,
} from "../../src/lib/sitemap-utils";

describe("sitemap utilities", () => {
  it("escapes XML-sensitive characters", () => {
    assert.equal(
      xmlEscape(`https://example.com/search?q=rent&city=Kenya's "best" <homes>`),
      "https://example.com/search?q=rent&amp;city=Kenya&#39;s &quot;best&quot; &lt;homes&gt;",
    );
  });

  it("builds URL entries with sitemap metadata", () => {
    const entry = buildUrlEntry({
      loc: "https://example.com/vacancies?q=rent&location=nairobi",
      lastmod: "2026-06-02",
      changefreq: "weekly",
      priority: "0.8",
    });

    assert.match(entry, /<loc>https:\/\/example\.com\/vacancies\?q=rent&amp;location=nairobi<\/loc>/);
    assert.match(entry, /<lastmod>2026-06-02<\/lastmod>/);
    assert.match(entry, /<changefreq>weekly<\/changefreq>/);
    assert.match(entry, /<priority>0.8<\/priority>/);
  });

  it("wraps urlsets and sitemap indexes", () => {
    const urlset = wrapUrlset(buildUrlEntry({ loc: "https://example.com/" }));
    const index = wrapSitemapIndex([
      buildSitemapIndexEntry("https://example.com/sitemap.xml", "2026-06-02"),
    ]);

    assert.match(urlset, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
    assert.match(urlset, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    assert.match(index, /<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    assert.match(index, /<lastmod>2026-06-02<\/lastmod>/);
  });

  it("formats dates and gzips XML content", () => {
    assert.equal(formatDate(new Date("2026-06-02T12:45:00.000Z")), "2026-06-02");
    assert.ok(Buffer.isBuffer(gzipXml("<xml />")));
    assert.ok(gzipXml("<xml />").length > 0);
  });
});
