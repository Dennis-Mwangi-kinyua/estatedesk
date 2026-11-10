# Demo onboarding and organization blacklist handoff — 10 November 2026

The release branch contains the current web, native mobile, CRM, demo/trial, organization-management and supporting workflow changes in the checkout. Deployment and further testing were deferred at the user's request; pushing this branch is not a production release.

## Demo and trial behavior

- The homepage and navigation link to `/register?intent=demo` for a free 30–45 minute guided demo.
- Platform Admin → Demo requests (`/platform/demos`) provides request search, ownership, appointments, trial dates and CRM follow-up links. Native Platform also has a demo-request entry.
- Request submission does not provision credentials or start a trial. Pro/Plus workspace creation starts a 14-day trial and creates staff follow-up tasks for days 3, 7, 12 and 14. These are not automatically sent customer messages.

## Organization blacklist behavior

Platform Admin → Organizations → select organization → Blacklist & access lock requires an exact slug confirmation and a reason. Current memberships, unarchived/non-deleted tenant profiles and active/non-deleted landlord profiles are included. Associated users are blocked across organizations and platform roles; historical employment and archived profiles alone are excluded.

The lock disables the organization, revokes affected web/native sessions, removes browser push subscriptions and disables affected API keys. Every authenticated session creation/read checks the blacklist. Unlocking is audited and leaves reactivation and new credentials as separate operations. Multiple organization locks remain independent.

## Required before deployment

Apply `20261110200000_organization_blacklist` and any other pending checked-in migrations to the intended database, with a verified private backup, before deploying the matching application. Regenerate Prisma Client during the build. The new migration adds nullable `Organization.blacklistedAt` and `Organization.blacklistReason` fields plus an index; it does not blacklist existing organizations.

No migration was applied during this release-preparation turn. The read-only preflight to the configured database timed out; its migration state remains unverified. No production deployment, native signing or store submission was performed. Vercel and Expo/EAS release access are not configured in this checkout.

## Evidence and subsequent testing

Earlier implementation checks passed: web TypeScript; mobile TypeScript; demo public-flow/authentication browser checks; blacklist desktop/mobile controls; isolated PostgreSQL coverage of multi-organization denial, revocation, unrelated/former users and overlapping locks; and the blacklist migration SQL in a rolled-back local transaction.

During release preparation, iOS and Android Hermes JavaScript bundles exported successfully with `EXPO_PUBLIC_API_URL=https://estatedesk.co.ke`. These are ignored build artifacts, not signed app binaries or installed-device verification. Further tests and the full-system mobile audit were deferred when the user requested a GitHub push instead.

After applying migrations to the intended test environment, verify:

1. Demo submission appears in the dedicated admin inbox; assignment, scheduling, organization creation and trial tasks work end to end.
2. Blacklisting denies existing web/native sessions and new sign-ins for every linked role, including multi-organization users; unrelated accounts retain access.
3. Unlock does not restore revoked credentials or silently reactivate the organization; another independent blacklist still blocks the account.
4. Check representative admin, organization, tenant, caretaker, security and landlord workflows on narrow phones/tablets, including forms, keyboard behavior, overflow and offline recovery.
5. Build the matching backend and native artifacts, verify their fingerprints/protocol/routes, then complete signed-device acceptance before publishing.
