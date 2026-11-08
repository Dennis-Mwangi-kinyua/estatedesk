# Organization deletion

Only `PLATFORM_ADMIN` and `SUPER_ADMIN` can delete or review deleted organizations.
The operator must type the current organization slug. Deletion atomically sets
`deletedAt`, disables the organization and API keys, clears active workspace selections,
and writes an `ORGANIZATION_DELETE_REQUESTED` audit marker. Public inventory is
invalidated. Linked records remain in place, so foreign keys cannot block this step.
Deleted organizations cannot be reactivated. Repeating deletion preserves the original
deadline. Shared user accounts and their access to other organizations are preserved.

The directory excludes deleted organizations. Platform admins can use
**Organizations → Deleted organizations** to review counts, recent records and the
read-only tenant directory, including profiles, leases, payments, charges and activity.
Public lease-signing links also reject disabled/deleted organizations.

## Permanent cleanup

Both Vercel configurations schedule `/api/cron/retention` daily at 21:20 UTC.
Set a strong `CRON_SECRET` in the production Vercel environment; Vercel sends it as
`Authorization: Bearer …`. The endpoint rejects missing or incorrect authorization.
No public or ordinary organization action can invoke cleanup. Production secret
configuration must be verified in Vercel; adding the example variable does not set it.

Cleanup selects only disabled organizations whose deletion **and explicit deletion
marker** are at least 30 full days old. Legacy soft-deleted records without that marker
are excluded. Cleanup removes owned Cloudflare, S3 and local files in resumable batches
before removing their database references. Unknown storage or failed file removal
retains the references and reports a failure for investigation/retry. A file referenced
by another organization's Asset is preserved. Shared global accounts and identities
are outside the purge scope.

The transaction rechecks eligibility under an organization row lock and removes owned
records in dependency order before deleting the organization. It does not disable
foreign keys. The generated plan includes indirectly owned children and organization
push devices, and excludes shared users, sessions, providers and global identities.
After schema changes run `node scripts/generate-org-purge-plan.mjs`; the schema coverage
test fails if the checked-in plan is stale.

Removal is eligible after 30 days and occurs on a subsequent successful daily run.
Each run handles up to three organizations within its execution budget. Large file
sets continue across batches/runs. Monitor the cron JSON `failed`/`pending` counts and
server error logs; failed cleanup returns HTTP 503 and retries on the next run.
Production database backups follow their separate backup retention policy.

## Validation

Unit tests cover authorization, confirmation, atomic rollback, idempotent deletion,
reactivation prevention, retention boundaries and schema coverage. A real browser
checks the circular spinner, pending announcement and disabled submit button.
Disposable-local-database integration tests cover linked accounting/property records,
shared-account isolation, legacy deletion protection, the deadline, resumable file
removal and refusing to purge uncleaned file references. Production data is never
deleted as part of these tests.

## Organization feature scope

The organization detail page includes **Features and public vacancies**. Its switches
affect only the organization named on the page. They control vacant-house access,
taxes, water billing, inspections and the tenant portal. Role and resource restrictions
still apply. Existing platform-wide overrides take precedence and lock those switches
until the override is changed in Website Control.

**Hide public vacant listings** is an independent organization visibility setting. It
removes listings from public browse/search and direct listing lookup, including when
the vacancies feature is forced on globally. It does not change units, occupancy,
leases or any other organization's listings. Turning hiding off restores eligibility;
the normal listing, feature and organization status rules still apply.

The platform feature matrix supports filtering by organization ID, slug or name.
Feature changes require a platform admin, validate keys and boolean values, lock the
target organization to preserve concurrent changes, and save the audit record in the
same transaction. Deleted organizations cannot receive feature changes. Public vacancy
caches and workspace layouts are invalidated after a successful update.
