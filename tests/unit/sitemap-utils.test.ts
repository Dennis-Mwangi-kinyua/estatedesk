import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  PUBLIC_SITEMAP_PATHS,
  buildSitemapIndexEntry,
  buildUrlEntry,
  formatDate,
  gzipXml,
  wrapSitemapIndex,
  wrapUrlset,
  xmlEscape,
} from "../../apps/web/src/lib/sitemap-utils";
import { GET as getSitemapIndex } from "../../apps/web/src/app/sitemap-index.xml/route";
import { GET as getStaticSitemap } from "../../apps/web/src/app/sitemap.xml/route";
import { GET as getPropertiesSitemap } from "../../apps/web/src/app/sitemap-properties.xml/route";
import { GET as getRentalLandingsSitemap } from "../../apps/web/src/app/sitemap-rental-landings.xml/route";
import { GET as getUnitsSitemap } from "../../apps/web/src/app/sitemap-units.xml/route";
import { GET as getVacanciesSitemap } from "../../apps/web/src/app/sitemap-vacancies.xml/route";
import { publicSiteIndexItems } from "../../apps/web/src/lib/public-site-index";
import {
  PUBLIC_RENTAL_LOCATIONS,
  publicRentalLocationPaths,
} from "../../apps/web/src/lib/public-rental-seo";

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

  it("lists every public sitemap shard in the sitemap index", async () => {
    const response = await getSitemapIndex();
    const xml = await response.text();

    for (const sitemapPath of PUBLIC_SITEMAP_PATHS) {
      assert.match(xml, new RegExp(`${sitemapPath.replace(".", "\\.")}<\\/loc>`));
    }

    assert.doesNotMatch(xml, /\/sitemap-properties\.xml<\/loc>/);
    assert.doesNotMatch(xml, /\/sitemap-units\.xml<\/loc>/);
  });

  it("emits every public manifest page in the static sitemap", async () => {
    const response = await getStaticSitemap();
    const xml = await response.text();

    for (const item of publicSiteIndexItems) {
      assert.match(xml, new RegExp(`<loc>https://estatedesk\\.co\\.ke${item.path}<\\/loc>`));
      assert.match(xml, new RegExp(`<priority>${item.priority}<\\/priority>`));
      assert.match(xml, new RegExp(`<changefreq>${item.changefreq}<\\/changefreq>`));
    }
  });

  it("keeps marketing pages covered by the public indexing manifest", () => {
    const marketingRoot = path.join(process.cwd(), "apps/web", "src", "app", "(marketing)");
    const marketingPaths = fs
      .readdirSync(marketingRoot, { withFileTypes: true })
      .filter((item) => item.isDirectory() && fs.existsSync(path.join(marketingRoot, item.name, "page.tsx")))
      .map((item) => `/${item.name}`)
      .sort();
    const indexedPaths = publicSiteIndexItems.map((item) => item.path).sort();
    const indexedPathSet = new Set<string>(indexedPaths);

    assert.deepEqual(
      marketingPaths.filter((pagePath) => !indexedPathSet.has(pagePath)),
      [],
    );
    assert.ok(indexedPaths.includes("/"));
  });

  it("builds location-only vacancy landing paths from the Kenya town index", () => {
    const slugs = PUBLIC_RENTAL_LOCATIONS.map((location) => location.slug);
    const paths = publicRentalLocationPaths().map((location) => location.path);

    assert.ok(slugs.length > 80);
    assert.ok(paths.includes("/vacancies/nairobi"));
    assert.ok(paths.includes("/vacancies/kiambu"));
    assert.ok(paths.includes("/vacancies/kilimani"));
    assert.equal(new Set(paths).size, paths.length);
  });

  it("keeps legacy sitemap routes as compatibility aliases", async () => {
    assert.equal(getPropertiesSitemap, getRentalLandingsSitemap);
    assert.equal(getUnitsSitemap, getVacanciesSitemap);
  });
});
