# Production Deploy Checklist

Use this checklist for every EstateDesk production release.

1. Pull the intended release commit.
2. Confirm environment variables are present and point to production services.
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
9. Check production logs for server component digests, database timeouts, and failed audit writes.
