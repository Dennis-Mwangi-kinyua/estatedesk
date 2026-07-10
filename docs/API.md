# API Reference

EstateDesk exposes a small set of HTTP endpoints for health checks, scheduled jobs, public vacancy discovery, and authenticated client utilities. Most business workflows run through server actions inside the authenticated app.

Base URL: use `APP_URL` or `NEXT_PUBLIC_APP_URL`.

## Health

### `GET /api/health`

Liveness and configuration readiness probe.

**Query parameters**

| Name | Values | Description |
| --- | --- | --- |
| `deep` | `1` | Also checks database connectivity |

**Response**

```json
{
  "service": "estatedesk",
  "status": "ok",
  "checkedAt": "2026-07-04T12:00:00.000Z",
  "uptimeSeconds": 120,
  "latencyMs": 4,
  "environment": {
    "ready": true,
    "configured": 18,
    "total": 24,
    "missingRequired": []
  },
  "database": { "checked": false }
}
```

When `deep=1`, `database` becomes either `{ "checked": true, "status": "ok", "latencyMs": 12 }` or an error object. The route returns `503` when readiness is degraded.

**Notes**

- Response is `no-store` and tagged `noindex`
- Used by `.github/workflows/uptime.yml` when `HEALTHCHECK_ENABLED=true`

## Cron jobs

All cron routes require:

```http
Authorization: Bearer <CRON_SECRET>
```

In non-production environments, cron routes are allowed when `CRON_SECRET` is unset. In production, `CRON_SECRET` is required.

### `GET|POST /api/cron/notifications`

Runs the notification delivery cron.

**Schedule in repo:** every 10 minutes via `.github/workflows/cron.yml` when `PRODUCTION_CRON_ENABLED=true`.

### `GET|POST /api/cron/retention`

Runs retention review for soft-deleted records.

**Schedule in repo:** daily at 02:20 UTC via `.github/workflows/cron.yml`.

## Public vacancy listings

### `GET /api/public/vacant-houses`

Returns vacant units for the organization tied to an active API key.

**Authentication**

```http
Authorization: Bearer <organization-api-key>
```

The API key must be active, unexpired, and include the `vacant_units:read` permission in its `publicListings` permission set.

**Rate limiting**

- 60 requests per minute per API key or client IP
- `429` responses include `Retry-After`

**Success response**

```json
{
  "count": 2,
  "houses": [
    {
      "id": "unit-id",
      "houseNumber": "A1",
      "bedrooms": 2,
      "bathrooms": 1,
      "roomCount": 3,
      "location": "Kilimani, Nairobi",
      "property": "Sunrise Apartments",
      "building": "Block A",
      "type": "APARTMENT",
      "price": 45000,
      "serviceCharge": 2000,
      "garbageFee": 500,
      "securityFee": null,
      "electricityBilling": "TENANT",
      "hasBalcony": true,
      "viewingFeeRequired": false,
      "viewingFeeAmount": null,
      "images": [
        { "url": "storage-key", "fileName": "front.jpg" }
      ],
      "currency": "KES"
    }
  ]
}
```

**Error responses**

| Status | Meaning |
| --- | --- |
| `401` | Missing or invalid bearer token |
| `429` | Rate limit exceeded |

**Notes**

- Maximum 200 units per response
- Successful calls update API key `lastUsedAt`
- Public vacancy pages live at `/vacancies/[location]` and unit detail routes

## Authenticated client utilities

### `GET /api/pwa/badge-count`

Returns unread notification count for the signed-in user.

**Authentication:** session cookie

**Response**

```json
{ "count": 3 }
```

Used by the PWA, browser extension, and in-app badge sync.

### `GET /api/push/vapid-public-key`

Returns the public VAPID key for web push subscription.

### `POST /api/push/subscriptions`

Stores a browser push subscription for the signed-in user.

### `POST /api/push/test`

Sends a test push notification in supported environments.

## Webhooks

### `POST /api/webhooks/mpesa`

M-Pesa callback endpoint. Configure `MPESA_CALLBACK_URL` to point at this route when the integration is live.

### `POST /api/webhooks/kcb-ipn`

KCB Buni Instant Payment Notification receiver. KCB POSTs account credit events here after registration with Buni.

- Auth: `Signature` / `x-kcb-signature` HMAC (or shared secret) via `KCB_BUNI_IPN_SIGNATURE_SECRET`; optional `?secret=` fallback
- Response: `{ "transactionID", "statusCode", "statusMessage" }` (`statusCode` 0 = accepted)
- Matched payments stay `verificationStatus: PENDING` until the organization confirms and issues a receipt
- Unmatched notifications are logged to platform webhook samples and still acknowledged so KCB does not retry forever

## Legal and marketing utilities

| Route | Purpose |
| --- | --- |
| `GET /api/legal/terms.pdf` | Serves the terms PDF |
| `GET /api/marketing/referrals/[code]` | Referral code validation for registration |
| `GET /api/og/vacancy/[id]` | Open Graph image generation for vacancy pages |

## Authenticated export routes

These routes require an authenticated organization or platform session and are not public integrator APIs:

- `GET /api/org/reports/reconciliation`
- `GET /api/org/reports/export`
- `GET /api/data-exports/[requestId]/download`
- `GET /api/platform/data-exports/[slug]/download`

## Discovery for LLMs and search

- `GET /llms.txt` — public page and guide index for LLM discovery
- `GET /robots.txt` — allows `/llms.txt` and points to `/sitemap-index.xml`
- `GET /sitemap-index.xml` — sitemap index for public marketing and vacancy pages

See `SITEMAPS.md` for sitemap validation and Search Console submission.