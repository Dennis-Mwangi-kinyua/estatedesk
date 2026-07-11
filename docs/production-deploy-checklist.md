# Production Deploy Checklist

Use this checklist for every EstateDesk production release.

Also see **`docs/PRODUCTION_GO_LIVE.md`** for soft-launch vs full commercial scale gates.

0. Run offline env check:

   ```bash
   npm run production:check
   ```

1. Pull the intended release commit.
2. Confirm environment variables are present and point to production services.
   - Configure `NEXT_PUBLIC_APP_URL` / `APP_URL` for the canonical domain.
   - Configure Search Console / Webmaster verification tokens when available.
   - Configure analytics/ad IDs only after consent and privacy review.
   - Enable `NEXT_PUBLIC_ENABLE_WEB_VITALS` when production performance reporting is desired.
   - Configure `SECURITY_ALERT_WEBHOOK_URL` or confirm security alerts will only go to logs.
3. Install dependencies with the lockfile.
4. Apply database migrations:

   ```bash
   npx prisma migrate deploy
   ```

5. Regenerate Prisma Client:

   ```bash
   npx prisma generate
   ```

6. Build the application:

   ```bash
   npm run build
   ```

7. Restart the Next.js process.
8. Smoke test:
   - Login with a platform admin.
   - Login with an organization admin.
   - Confirm suspended users see `/account-suspended`.
   - Confirm first-login users reach `/change-password`.
   - Open `/platform/users`.
   - Open `/dashboard/org`.
   - Confirm public pages send expected security headers.
   - Confirm `/robots.txt`, `/sitemap-index.xml`, and vacancy detail metadata render correctly.
   - Confirm analytics, ad tags, and Web Vitals reporting are either intentionally active or intentionally disabled.
   - Trigger a retention report dry run through `/api/cron/retention`.
   - Confirm security alert delivery for API key, data export, and platform-user changes.
   - For capacity-sensitive releases, run the relevant load-test stage from `docs/LOAD_TESTING.md`.
9. Check production logs for server component digests, database timeouts, and failed audit writes.
