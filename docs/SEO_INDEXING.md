# EstateDesk SEO & Indexing

Last verified: **2026-07-12**

This document is the operational source of truth for **public indexability**.  
Google/Bing **cannot** be forced to index pages from the codebase alone — you must submit sitemaps in Search Console. The app is built so public pages are **ready to be indexed**.

### Product positioning (use in GSC titles / content)

EstateDesk is **Kenya-built property management software**: M-Pesa rent collection, water billing, offline caretaker metering, double-entry accounting, **KRA eTIMS/eRITS-ready receipts**, WhatsApp ops, public vacancy SEO, and role-based staff access. Primary commercial landing: `/property-management-software-kenya`.

---

## Indexability status (code + live checks)

| Check | Status | Evidence |
| --- | --- | --- |
| Canonical site URL | Ready | `getSiteUrl()` → `https://estatedesk.co.ke` (or `NEXT_PUBLIC_APP_URL`) |
| Root metadata | Ready | Title, description, OG/Twitter, `robots: index,follow` |
| JSON-LD | Ready | Organization, WebSite, SoftwareApplication, FAQ, nav ItemList |
| `robots.txt` | Ready | Allows `/`, `/llms.txt`; disallows dashboards/API/private |
| Sitemap index | Ready | `/sitemap-index.xml` lists 4 public shards |
| Static marketing sitemap | Ready | `/sitemap.xml` (~34 public URLs) |
| Vacancy sitemaps | Ready | `/sitemap-vacancies.xml`, `/sitemap-vacancy-pages.xml` |
| Rental landings sitemap | Ready | `/sitemap-rental-landings.xml` (large town/category set) |
| Gzip sitemaps | Ready | `*.xml.gz` routes |
| LLM discovery | Ready | `/llms.txt` |
| PWA manifest | Ready | `/manifest.webmanifest` |
| Private dashboards | Ready | `privatePageMetadata` → `noindex,nofollow` + robots disallow |
| Unit tests | Pass | `seo.test.ts`, `sitemap-utils.test.ts`, `public-rental-seo.test.ts`, `guides.test.ts` |

### Live HTTP smoke (2026-07-10)

| Path | HTTP | Notes |
| --- | --- | --- |
| `/` | 200 | canonical + index,follow + JSON-LD |
| `/robots.txt` | 200 | Sitemap points to `/sitemap-index.xml` |
| `/sitemap-index.xml` | 200 | 4 child sitemaps |
| `/sitemap.xml` | 200 | ~34 locs |
| `/sitemap-vacancies.xml` | 200 | DB-driven |
| `/sitemap-rental-landings.xml` | 200 | Large landings set |
| `/sitemap-vacancy-pages.xml` | 200 | Vacancy hub pages |
| `/llms.txt` | 200 | Public discovery list |
| `/vacancies` | 200 | Public |
| `/pricing` `/services` `/faq` `/contact` `/privacy` `/terms` `/guides` `/register` | 200 | `robots=index, follow` |
| `/login` | 200 | Public auth (acquisition) |
| `/dashboard/tenant` | 307 | Auth redirect (not public) |

---

## Public vs private

### Must be indexed

- Marketing: `/`, `/services`, `/pricing`, `/faq`, `/contact`, guides, market landings  
- Product SEO landings (rent tracking, water billing, landlord software, Kenya/Dubai, etc.)  
- Vacancies discovery: `/vacancies`, location/category landings, unit detail pages  
- Legal: `/privacy`, `/terms`  
- Register (acquisition)

### Must not be indexed

- `/dashboard/**`, `/platform/**`  
- `/api/**`, `/print/**`, `/sign-lease/**`, invite/offline/suspended routes  
- Authenticated org workspaces (`/properties`, `/units`, etc. when used as workspace)

Enforced by:

1. `apps/web/src/app/robots.ts` — `disallow` list  
2. `privatePageMetadata` in `apps/web/src/lib/seo.ts` — meta `noindex` on app shells  

---

## Sitemap map

| URL | Generator | Purpose |
| --- | --- | --- |
| `/sitemap-index.xml` | `sitemap-index.xml/route.ts` | Submit **this** to Google/Bing |
| `/sitemap.xml` | `sitemap.xml/route.ts` | Core marketing + guides |
| `/sitemap-vacancies.xml` | vacancy unit details | Indexed rental listings |
| `/sitemap-vacancy-pages.xml` | vacancy hubs | Category/location hubs |
| `/sitemap-rental-landings.xml` | town/category landings | Long-tail SEO |
| `*.xml.gz` | gzip variants | Bandwidth-friendly |

Shared helpers: `apps/web/src/lib/sitemap-utils.ts`, `apps/web/src/lib/public-site-index.ts`  
Narrative guide: root `SITEMAPS.md`

---

## Environment for production SEO

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` or `APP_URL` | **Yes** | Canonical host (must be production `https://estatedesk.co.ke`) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Recommended | GSC HTML tag verification |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Recommended | Bing `msvalidate.01` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Analytics (after consent) |
| `S3_*` | Optional | Host gzipped sitemap objects |

Never set the public app URL to `localhost` in production — sitemaps and canonicals would poison search.

---

## How to get fully indexed (operator steps)

Indexing is a **Search Console workflow**, not a code toggle.

### Google Search Console

1. Verify property `https://estatedesk.co.ke` (DNS or HTML tag via env).  
2. **Sitemaps** → submit:  
   `https://estatedesk.co.ke/sitemap-index.xml`  
3. After deploy, use **URL Inspection** on `/`, `/vacancies`, `/pricing`, `/faq`.  
4. Monitor **Pages** / Coverage for soft 404s, redirects, or excluded private URLs.  
5. Re-submit sitemap after large content or vacancy catalog changes.

### Bing Webmaster Tools

1. Verify the same domain.  
2. Submit the same sitemap index URL.  
3. Optionally import GSC verification.

### Recurring hygiene

- Keep vacancy pages returning **200** with unique titles/descriptions.  
- Avoid duplicate canonicals (www → apex is already redirected in `next.config.ts`).  
- Do not add authenticated dashboards to sitemaps.  
- After major marketing rewrites, re-request indexing for top money pages.

---

## Local verification commands

```bash
npm run dev

curl -sS http://localhost:3000/robots.txt
curl -sS http://localhost:3000/sitemap-index.xml
curl -sS http://localhost:3000/sitemap.xml | head
curl -sS http://localhost:3000/llms.txt | head

# unit SEO suite
node --import tsx --test tests/unit/seo.test.ts tests/unit/sitemap-utils.test.ts tests/unit/public-rental-seo.test.ts tests/unit/guides.test.ts
```

---

## Gaps / not automatable in-repo

| Item | Status |
| --- | --- |
| Google actually indexing every URL | **Operator** — GSC only |
| Automated GSC API push | Not in repo (optional later) |
| Counsel legal review of marketing claims | Separate legal track |
| Production crawl budget tuning | After GSC baseline data |

---

## Key source files

- `apps/web/src/lib/seo.ts` — site constants, public/private metadata helpers  
- `apps/web/src/app/layout.tsx` — root metadata, verification tags  
- `apps/web/src/app/robots.ts` — robots rules  
- `apps/web/src/app/sitemap-*.xml/**` — sitemap routes  
- `apps/web/src/app/llms.txt/route.ts` — LLM index  
- `apps/web/src/lib/guides/articles.ts` — long-form SEO content  
- `tests/unit/seo.test.ts`, `sitemap-utils.test.ts`, `public-rental-seo.test.ts`
