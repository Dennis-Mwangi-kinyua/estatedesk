# EstateDesk go-live checklist (remaining ops)

Code is production-ready for the features below. **You** must complete external accounts and Search Console.

## Google indexing (cannot be automated in-repo)

1. Open [Google Search Console](https://search.google.com/search-console) for `https://estatedesk.co.ke`.
2. Verify ownership (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel env).
3. Submit sitemap: `https://estatedesk.co.ke/sitemap-index.xml`.
4. Request indexing for `/` and `/property-management-software-kenya`.
5. Optional: Bing Webmaster with `NEXT_PUBLIC_BING_SITE_VERIFICATION`.

## KRA eTIMS (live)

```
KRA_ETIMS_ENVIRONMENT=sandbox|production
KRA_ETIMS_BASE_URL=
KRA_ETIMS_CLIENT_ID=
KRA_ETIMS_CLIENT_SECRET=
KRA_ETIMS_CU_SERIAL=
KRA_ETIMS_WEBHOOK_SECRET=
KRA_ETIMS_BHF_ID=00
```

Webhook: `https://estatedesk.co.ke/api/webhooks/kra-etims`

## WhatsApp Business

```
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
```

Webhook: `https://estatedesk.co.ke/api/webhooks/whatsapp`

## Web Push (free alerts)

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:ops@estatedesk.co.ke
```

Generate: `node scripts/generate-web-push-keys.mjs`

## Database migrations

```
npx prisma migrate deploy
```

Includes `SECURITY` charge type and `RentRewardRedemption`.

## Smoke after deploy

- [ ] Combined bill allocates security before rent
- [ ] Accounting shows MTD comparison + aging CSV
- [ ] Caretaker vendors quote price check
- [ ] Tenant RentRewards redeem (after migrate)
- [ ] Taxes desk eTIMS readiness panel
- [ ] `/llms.txt` and Kenya landing indexable
