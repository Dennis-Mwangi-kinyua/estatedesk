# Unified platform workspace and public SEO

Date: 2026-11-11. Delivery: GitHub only; no deployment or production database changes.

## Platform workspace

The platform home at `/platform` now serves customer operations and technical operations together. Desktop navigation, phone navigation and the native app use the same authorized catalogue, grouped into overview, customers and growth, revenue and finance, people and communication, reliability and integrations, security and governance, and settings and guidance.

There is no Administration/Developer switch. Old `/platform/developer` bookmarks redirect to `/platform`; private documentation at `/platform/developer/docs` remains available. Login, dashboard entry and password-change completion all return platform operators to `/platform`, regardless of old mode cookies. Ordinary organization roles retain their existing destinations.

Demo and provider counts remain in navigation. Primary shortcuts include demo requests, system health, queues, security and business operations. The home adds queued/failed notification counts and failed scheduled runs in the last 24 hours. Failed reads show `Unavailable`, rather than reporting a false zero.

Existing `SUPER_ADMIN` and `PLATFORM_ADMIN` authorization is preserved. A unified presentation does not promote accounts. Website Control remains guarded and visible only to super admins. The native API still authorizes links before returning them.

## Public SEO

Added `/rent-collection-software` and `/property-management-onboarding`, with distinct descriptions, self-canonicals, page and FAQ structured data, practical workflow examples and links from the public footer. The examples are explicitly illustrative; no customer results or testimonials were invented. Both pages enter the static sitemap and discovery manifest through `publicSiteIndexItems`. The read-only public audit checks both routes explicitly.

The live mobile lab report is [mobile-lab.json](mobile-lab.json). A single cold run used a 390 × 844 viewport, 4× CPU slowdown, 150 ms network latency and 1.6 Mbps download. Live results: homepage LCP 3.284 s / CLS 0.0058; login LCP 1.976 s / CLS 0; services LCP 1.772 s / CLS 0. None had horizontal overflow. These samples measure the currently deployed site, not this unpublished release. They are not field Core Web Vitals, do not measure INP and are not a Lighthouse score. Homepage LCP remains a performance follow-up; do not describe the site as passing all Core Web Vitals.

## Account-dependent follow-up

Google/Bing ownership and indexing cannot be established from source or a public HTTP response. No Google Search Console credentials/site property, Bing Webmaster API key or verification tokens were configured in this environment. No ownership verification or sitemap submission was performed. No hosting connection was established; the user's GitHub-only delivery instruction remains in effect.

After an authorized deployment:

1. Configure the canonical production URL as `https://estatedesk.co.ke` and re-run `npm run audit:public` and `npm run audit:performance` against production.
2. Verify ownership through DNS or the supported `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_SITE_VERIFICATION` metadata variables. Confirm ownership in the respective search account.
3. Submit `https://estatedesk.co.ke/sitemap-index.xml`. Existing `scripts/submit-sitemaps.mjs` and `.github/workflows/sitemap-ping.yml` support authenticated submission. Configure their account credentials through the deployment/CI secret store; do not commit credentials. Read the script for the exact Google service-account or credentials-file and Bing API-key inputs. Enable the guarded workflow only after production publication.
4. Inspect representative URLs in Search Console and Bing Webmaster Tools, review excluded URLs and validate production canonicals. Submission does not guarantee indexing.
5. Review mobile field LCP, CLS and INP in Search Console when sufficient real-user data exists. The existing optional Web Vitals reporter can collect real-user metrics when configured; no monitoring flags were silently enabled.

References: [Search Console setup](https://developers.google.com/search/docs/monitor-debug/search-console-start), [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals).

## Validation

- Focused unit suites: unified navigation, mobile layout, workspace entry, SEO helpers, sitemap utilities, robots policy and sitemap submission.
- Native management navigation and native workspace route coverage.
- Heading hydration check in Chromium.
- Desktop and phone browser checks: role navigation (2 cases), unified shell and new public pages (6 cases). Checks include old browser mode preferences, badge accessibility, all tool groups, focus restoration, overflow, canonical metadata, JSON-LD and sitemap inclusion.
- Web and native TypeScript checks; diff whitespace check.

The organization blacklist migration from the earlier release remains pending production application. This change adds no database migration.
