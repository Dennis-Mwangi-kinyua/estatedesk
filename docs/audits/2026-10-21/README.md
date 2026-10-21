# SEO review — 21 October 2026

Implemented locally: shorter Kenya-focused homepage metadata; validated canonical origins; deduplicated keywords; corrected Custom-plan pricing and duplicate software schema; accurate organization identity and PNG logo; stay-specific sharing metadata, pagination canonicals and noindex for filtered searches; guide article social metadata and schema images; stronger public audit checks for canonicals, indexing, headings and social tags.

Verification: 22 SEO, robots, sitemap and rental tests passed. Web TypeScript and targeted ESLint passed. The live audit covers 13 public endpoints. Live reports describe the deployed site before these local changes are deployed, not validation of the new deployment.

Mobile lab: homepage LCP 2.18s, services 1.60s, login 3.90s; zero observed layout shift and no horizontal overflow. Single cold samples under 4x CPU and 1.6Mbps download; not field Core Web Vitals, a Lighthouse score, or INP measurement. Login remains a performance follow-up.

## Release and ongoing checks

1. Deploy these changes through the normal release process and rerun `npm run audit:public` and `npm run audit:performance`.
2. Verify the canonical domain in Google Search Console and Bing Webmaster Tools. Submit `https://estatedesk.co.ke/sitemap-index.xml`; inspect the homepage, Kenya landing, pricing, a guide and a published rental URL. This review did not access webmaster accounts or submit URLs.
3. Validate the deployed JSON-LD using Google's Rich Results Test. Custom quotes must never be advertised as free; do not invent reviews, ratings, addresses or geo coordinates.
4. Monitor indexing, search queries, conversions and field Core Web Vitals. Improve login LCP after profiling. Maintain original, accurate guides and authentic customer evidence, and pursue relevant industry links.

Google does not guarantee indexing or rankings. Software schema does not guarantee rich results, and FAQ markup is not a promise of expanded search listings or AI recommendations.

References: [canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [software structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app), [FAQ restrictions](https://developers.google.com/search/blog/2023/08/howto-faq-changes).
