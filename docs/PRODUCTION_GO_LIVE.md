# Production go-live (full-scale)

Engineering can ship product capability. **Commercial full-scale** still needs the operator gates below.

## Automated / in-app (already in product)

| Check | Where |
| --- | --- |
| Env + queue + payment failure snapshot | `/platform/system-health` → Production readiness |
| Deep health (authorized) | `GET /api/health?deep=1` with `Authorization: Bearer $CRON_SECRET` |
| Offline env script | `npm run production:check` |
| Plan limits + upgrade queue | Org settings billing + `/platform/billing` |
| Payment action permissions | `payments.verify` / `payments.manage` on org payment mutations |

## Deploy sequence

1. `npx prisma migrate deploy`
2. `npx prisma generate`
3. `npm run build` (or platform CI)
4. `npm run production:check` (fix env fails)
5. Smoke: login platform admin, org admin, tenant, caretaker
6. Live STK on production callback URL
7. Confirm crons fire with `CRON_SECRET`

## Operator gates (human)

Copy into your launch ticket and tick:

- [ ] Kenya counsel sign-off (`docs/KENYA_LEGAL_REVIEW.md`)
- [ ] Disposable restore drill evidence (`docs/RESTORE_DRILL_EVIDENCE.md`)
- [ ] Production crons enabled: notifications, retention, owner-statements
- [ ] External uptime on `/api/health` and deep health
- [ ] `SECURITY_ALERT_WEBHOOK_URL` delivers to Slack/Discord/Pager
- [ ] M-Pesa Daraja live: STK → callback → verify/allocate → receipt
- [ ] KCB IPN registered (if used)
- [ ] GSC/Bing: submit `https://estatedesk.co.ke/sitemap-index.xml`
- [ ] Manual a11y matrix on login + org + tenant + caretaker (`docs/ACCESSIBILITY_QA.md`)
- [ ] Pilot org soft-launch before open registration scale

## Soft launch vs full commercial scale

| Mode | Requirements |
| --- | --- |
| Soft launch (1–5 pilot orgs) | Env pass, migrate, crons, live payments E2E, platform-managed billing |
| Full commercial scale | Soft launch + legal sign-off + restore drill + uptime + GSC + a11y sign-off |

## Rollback

1. Redeploy previous git SHA.
2. Do **not** reverse migrations unless a forward fix is impossible.
3. Disable public registration via Website Control if incident is customer-facing.
4. Post status via `NEXT_PUBLIC_STATUS_PAGE_URL` if configured.
