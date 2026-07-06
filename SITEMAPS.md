# Sitemaps and Indexing

This document explains the sitemap and indexing setup in EstateDesk and how to validate and submit sitemaps.

## Routes and files

| Path | Purpose |
| --- | --- |
| `src/app/sitemap.xml/route.ts` | Static public marketing pages |
| `src/app/sitemap-vacancies.xml/route.ts` | DB-driven vacant unit detail pages |
| `src/app/sitemap-rental-landings.xml/route.ts` | Location/category rental landing pages |
| `src/app/sitemap-index.xml/route.ts` | Sitemap index referencing canonical public shards |
| `src/app/robots.ts` | Points to `/sitemap-index.xml`, allows `/llms.txt`, blocks dashboards/API/print/invite routes and LLM crawlers from private surfaces |
| `src/app/llms.txt/route.ts` | LLM/crawler discovery index for public pages and guides |
| `src/lib/public-site-index.ts` | Canonical public page manifest |
| `src/lib/sitemap-utils.ts` | Shared sitemap generation and gzip helpers |
| `src/app/api/public/vacant-houses/route.ts` | Authenticated public vacancy API |

## Required environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` or `APP_URL` | Yes in production | Canonical base URL |
| `S3_BUCKET_NAME` | Optional | Redirect gzipped sitemap assets to S3 when configured |
| Organization API keys | Optional | For `GET /api/public/vacant-houses` |

## Local testing

1. Start the app:

```bash
npm install
npm run dev
```

2. Check endpoints:

```bash
curl -sS http://localhost:3000/sitemap-index.xml
curl -sS http://localhost:3000/sitemap.xml
curl -sS http://localhost:3000/sitemap-vacancies.xml
curl -sS http://localhost:3000/sitemap-rental-landings.xml
curl -sS http://localhost:3000/robots.txt
curl -sS http://localhost:3000/llms.txt
curl -sS http://localhost:3000/sitemap-index.xml.gz
curl -sS http://localhost:3000/sitemap.xml.gz
curl -sS http://localhost:3000/sitemap-vacancies.xml.gz
curl -sS http://localhost:3000/sitemap-rental-landings.xml.gz
```

Replace `<id>` with a real unit id when testing vacancy detail pages:

```bash
curl -sS http://localhost:3000/vacancies/<id>
```

## Submitting to Google and Bing

1. Verify the domain in Google Search Console and Bing Webmaster Tools.
2. Submit `https://your-domain/sitemap-index.xml`.
3. Monitor Coverage and Indexing reports after publish or major content changes.

## Gzipped sitemaps

The app supports gzipped sitemap delivery in two ways:

- When `S3_BUCKET_NAME` is configured, `.gz` routes can redirect to the matching object in S3.
- Otherwise, `.gz` routes generate and return gzipped XML on demand.

Available gzip endpoints:

- `/sitemap-index.xml.gz`
- `/sitemap.xml.gz`
- `/sitemap-vacancies.xml.gz`
- `/sitemap-rental-landings.xml.gz`

Compatibility aliases `/sitemap-properties.xml` and `/sitemap-units.xml` exist, but they are not submitted in the sitemap index to avoid duplicate discovery paths. `/properties` and `/units` are authenticated workspace routes and should stay out of submitted sitemap indexes.

## Private operational routes (never submit)

These authenticated surfaces must remain **out** of sitemap indexes and are disallowed in `robots.ts`:

| Prefix | Examples | Why |
| --- | --- | --- |
| `/dashboard/` | `/dashboard/caretaker/today`, `/dashboard/org/issues` | Login-required workspaces |
| `/platform/` | `/platform/organizations` | Platform administration |
| `/api/` | `/api/health`, `/api/public/vacant-houses` | Machine endpoints |
| `/print/` | `/print/issues/[issueId]`, `/print/inspections/[inspectionId]` | Authenticated PDF/print views |
| `/accept-invite/` | tokenized invite acceptance | Transactional, not marketing |

Caretaker field operations (offline queue, SLA badges, handover, vendor dispatch) are product features inside `/dashboard/caretaker/*` and are documented in `docs/PROJECT_DOCUMENTATION.md` and `/llms.txt`, not in submitted sitemaps.

## Automation in this repository

The repo currently ships these GitHub Actions workflows:

| Workflow | File | Purpose |
| --- | --- | --- |
| Quality | `.github/workflows/quality.yml` | Lint, typecheck, and tests on push/PR |
| Uptime | `.github/workflows/uptime.yml` | Polls `/api/health` when `HEALTHCHECK_ENABLED=true` |
| Production Cron | `.github/workflows/cron.yml` | Calls notification and retention cron routes when `PRODUCTION_CRON_ENABLED=true` |

There is **no** automated Search Console sitemap submission workflow in this repo yet. Submit sitemaps manually after launch, or add a workflow later if you want API-based submission.

### Uptime workflow secrets and vars

- `vars.HEALTHCHECK_ENABLED=true`
- `secrets.HEALTHCHECK_URL` — base app URL checked by the workflow

### Cron workflow secrets and vars

- `vars.PRODUCTION_CRON_ENABLED=true`
- `secrets.PRODUCTION_APP_URL`
- `secrets.PRODUCTION_CRON_SECRET`

## Maintenance

- Update `src/lib/public-site-index.ts` when adding new public marketing pages
- Update guide content in `src/lib/guides/articles.ts` when publishing new `/guides/*` articles
- Run `npm test` — `tests/unit/seo.test.ts`, `tests/unit/robots-policy.test.ts`, `tests/unit/guides.test.ts`, and `tests/unit/sitemap-utils.test.ts` guard indexing expectations
- Re-submit `sitemap-index.xml` after major content or route changes