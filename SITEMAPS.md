# Sitemaps & Indexing — EstateDesk

This document explains the sitemap and indexing setup added to the project and how to validate and submit sitemaps.

Files added
- `src/app/sitemap.xml/route.ts` — primary sitemap of static marketing/auth pages.
- `src/app/sitemap-vacancies.xml/route.ts` — DB-driven sitemap for public vacant unit detail pages.
- `src/app/sitemap-index.xml/route.ts` — sitemap index referencing the primary sitemap and vacancy sitemap.
- `src/app/robots.txt/route.ts` — points to `/sitemap-index.xml`.
- `src/app/api/public/vacant-houses/route.ts` — public API returning vacant units (requires `VACANT_HOUSES_API_KEY` when set).
- `src/app/vacancies/[id]/page.tsx` — vacancy detail page with richer metadata, Open Graph, and JSON-LD schema markup.
- `.github/workflows/ping-sitemaps.yml` — nightly workflow to fetch sitemaps, gzip them, ping search engines, and upload optional S3 assets.
- `.github/workflows/submit-sitemap-gsc.yml` — optional workflow to submit `sitemap-index.xml` to Google Search Console.
- `.github/workflows/verify-search-console.yml` — optional workflow to create a Search Console property with a service account.
- `src/lib/sitemap-utils.ts` — shared sitemap generation and gzip helpers.

Required environment variables (production)
- `NEXT_PUBLIC_APP_URL` or `APP_URL` — base URL (e.g., `https://www.estatedesk.co.ke`).
- `VACANT_HOUSES_API_KEY` — optional, to enable the public vacant-houses API.
- `DEFAULT_CURRENCY` — optional, defaults to `KES` in structured data.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` — optional, for GitHub Action to publish gzipped sitemap files to S3.

Local testing
1. Run the dev server:

```bash
npm install
npm run dev
```

2. Check endpoints locally:

```bash
curl -sS http://localhost:3000/sitemap-index.xml
curl -sS http://localhost:3000/sitemap.xml
curl -sS http://localhost:3000/sitemap-vacancies.xml
curl -sS http://localhost:3000/robots.txt
curl -sS http://localhost:3000/sitemap-index.xml.gz
curl -sS http://localhost:3000/sitemap.xml.gz
curl -sS http://localhost:3000/sitemap-vacancies.xml.gz
# test a vacancy detail (replace <id> with a real unit id from your DB)
curl -sS http://localhost:3000/vacancies/<id>
```

Submitting to Google
1. Sign in to Google Search Console for your domain.
2. Add `https://www.estatedesk.co.ke/sitemap-index.xml` as a sitemap. Search engines will discover the index and all child sitemaps.
3. Monitor Coverage and Indexing reports for errors, blocked pages, or crawl issues.

Maintenance
- The GitHub Action `ping-sitemaps` will fetch all sitemap endpoints daily, gzip them, notify Google and Bing, and optionally upload gzipped sitemap assets to your configured S3 bucket.
- If you want faster updates, you can run the workflow manually after content changes or use a webhook that triggers the workflow on publish.

Serving gzipped sitemaps

The app now supports gzipped sitemap delivery in two ways:

- When `S3_BUCKET_NAME` is configured, the `.gz` route will redirect to the corresponding file in the S3 bucket.
- When `S3_BUCKET_NAME` is not configured, the `.gz` route will generate and return gzipped XML on demand.

Available gzip endpoints:

- `/sitemap-index.xml.gz`
- `/sitemap.xml.gz`
- `/sitemap-vacancies.xml.gz`
- `/properties` and `/units` are authenticated workspace routes, so they should stay out of submitted sitemap indexes.

Search Console automation & verification

The repo now includes two optional workflows:

- `.github/workflows/submit-sitemap-gsc.yml` — submits `sitemap-index.xml` to Google Search Console using a GCP service account.
- `.github/workflows/verify-search-console.yml` — attempts to create the Search Console property using the same service account.

To use them:
1. Create a Google Cloud service account and download a JSON key.
2. Add the service account email as an owner or a verified user for the Search Console property.
3. Store the JSON key in the repository secret `GCP_SA_KEY`.
4. Set `GCP_PROJECT_ID` and optional `SITE_URL`.

Important notes
- Search Console ownership must be granted to the service account or the property must be verified manually before the API can submit a sitemap.
- Manual verification in Search Console is usually required once per domain, then the service account can be used for automated sitemap submission.
- If you need further automations, the workflows can be extended to generate verification tokens or publish static sitemaps to a CDN.

If you want, I can also:
- Add scheduled server-side sitemap regeneration and CDN publishing.
- Add hreflang and multi-locale sitemap support if the site serves more than one language.
- Keep property and unit workspace pages private unless a separate public listing route is intentionally designed for SEO.
