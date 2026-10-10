# Initial tenancy charges

Creating a tenant with a unit, including through CSV import, creates first rent
and security deposit charges in the same transaction. The tenant and organisation
can view initial charges from active and past tenancies and download receipts.
Staff with payment verification permission can confirm partial or full payments.

## Existing tenancies

On the organisation tenant page, **Create missing initial charges** fills gaps
only for active tenancies without payment, waiver, or move-out history. It never
overwrites existing charges. Skipped tenancies require reconciliation against
their payment and move-out records; missing charges alone do not prove debt.

For a database-wide preview:

```sh
npm run billing:backfill-initial-charges
```

The preview reports lease and organisation IDs, missing charge types, amounts,
currency and review reasons. Add `-- --org=<orgId>` to restrict the preview.
After reviewing and authorizing the resulting obligations, apply with:

```sh
npm run billing:backfill-initial-charges -- --apply --actor=<staffUserId>
```

For an explicitly authorized maintenance run, `--system-actor` can replace
`--actor`. This creates a disabled user with no memberships or platform
privileges solely to identify the maintenance operation in the audit log.
Eligibility is rechecked in a serializable transaction for each lease. Repeated
runs do not duplicate initial charges. Applying records the affected period and
charge types in the audit log.
