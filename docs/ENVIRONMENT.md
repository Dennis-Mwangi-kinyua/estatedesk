# Environment Variables

This document groups EstateDesk environment variables by concern. Copy `.env.example` to `.env.local` for local development.

For runtime validation logic, see `src/lib/config/env.ts`. The health endpoint reports missing required values via `GET /api/health`.

## Quick reference

| Concern | Required locally | Required in production |
| --- | --- | --- |
| Database | Yes | Yes |
| Auth secrets | Yes | Yes |
| App URL | Recommended | Yes |
| Object storage | Optional | Yes when uploads/receipts are used |
| Messaging | Optional | Optional |
| Integrations | Optional | As each provider goes live |

## Core

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma at runtime |
| `DIRECT_URL` | Direct database URL for migrations and long-running jobs |
| `NEXT_PUBLIC_APP_URL` | Public site URL used in metadata, emails, and client links |
| `APP_URL` | Server-side canonical URL fallback |
| `NEXT_PUBLIC_STATUS_PAGE_URL` | External status page linked from `/status` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console verification token |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster verification token |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics measurement ID |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Google Ads conversion tag |
| `NEXT_PUBLIC_ENABLE_WEB_VITALS` | Enables client Web Vitals reporting |
| `NEXT_PUBLIC_ANALYTICS_DEBUG` | Debug mode for analytics helpers |

## Performance and scale

| Variable | Purpose |
| --- | --- |
| `PRISMA_POOL_MAX` | Connection pool size |
| `PRISMA_CONNECTION_TIMEOUT_MS` | Connection timeout |
| `PRISMA_IDLE_TIMEOUT_MS` | Idle connection timeout |
| `PRISMA_QUERY_TIMEOUT_MS` | Query timeout guardrail |
| `SYNC_EXPORT_ROW_LIMIT` | Maximum rows for synchronous exports |

## Security

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Signs session cookies and platform unlock cookies |
| `CRON_SECRET` | Bearer token for `/api/cron/*` routes in production |
| `PLATFORM_API_KEYS_PAGE_PASSWORD` | Password gate for the platform API keys page |

Generate strong secrets locally:

```bash
openssl rand -base64 48
```

## Observability

| Variable | Purpose |
| --- | --- |
| `SENTRY_DSN` | Sentry error reporting |
| `SENTRY_ENVIRONMENT` | Environment label sent to Sentry |
| `ALERT_WEBHOOK_URL` | General operational alert webhook |
| `SECURITY_ALERT_WEBHOOK_URL` | Security-sensitive alert webhook |

## Storage

| Variable | Purpose |
| --- | --- |
| `S3_BUCKET` | Bucket name |
| `S3_REGION` | AWS or compatible region |
| `S3_ENDPOINT` | Optional custom endpoint for S3-compatible providers |
| `S3_PUBLIC_BASE_URL` | Public asset base URL when using CDN or custom domain |
| `S3_ACCESS_KEY_ID` | Access key |
| `S3_SECRET_ACCESS_KEY` | Secret key |

## Messaging and PWA

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` | Browser-visible VAPID public key |
| `WEB_PUSH_PUBLIC_KEY` | Server VAPID public key |
| `WEB_PUSH_PRIVATE_KEY` | Server VAPID private key |
| `WEB_PUSH_SUBJECT` | VAPID subject, usually `mailto:support@...` |
| `NEXT_PUBLIC_ENABLE_PWA_IN_DEV` | Enables PWA install/testing in development |
| `WHATSAPP_*` | WhatsApp Business API credentials and template names |

Generate web push keys:

```bash
npm run generate:web-push-keys
```

## Integrations

Integration variables are grouped by provider. Most are approval-gated and optional until the provider is live.

| Group | Variables |
| --- | --- |
| KRA eTIMS | `KRA_ETIMS_*` |
| M-Pesa | `MPESA_*` |
| Aani | `AANI_*` |
| Dubai Ejari | `DLD_EJARI_*` |
| Banking | `BANKING_*` |
| Screening / KYC | `SCREENING_*`, `AECB_*`, `KYC_AML_PROVIDER` |
| FX / AI / escrow / e-sign / market data | `FX_*`, `AI_ASSISTANT_*`, `ESCROW_*`, `E_SIGNATURE_*`, `MARKET_DATA_*`, `INVESTMENT_COMPLIANCE_PROVIDER` |

See `docs/INTEGRATION_READINESS.md` for provider readiness expectations.

## Local setup checklist

1. Copy `.env.example` to `.env.local`
2. Point `DATABASE_URL` and `DIRECT_URL` at a local or disposable PostgreSQL database
3. Set `AUTH_SECRET` and `CRON_SECRET` to generated values
4. Run `npx prisma migrate dev`
5. Run `npm run dev`

## Production checklist

1. Store secrets in your deployment platform, not in git
2. Set `NEXT_PUBLIC_APP_URL` and `APP_URL` to the live domain
3. Configure `CRON_SECRET` and enable `.github/workflows/cron.yml` via `PRODUCTION_CRON_ENABLED=true`
4. Configure `HEALTHCHECK_ENABLED=true` and `HEALTHCHECK_URL` for `.github/workflows/uptime.yml`
5. Configure S3 before enabling uploads, receipts, or vacancy images
6. Review `docs/PRE_LAUNCH_STATUS.md` before commercial launch