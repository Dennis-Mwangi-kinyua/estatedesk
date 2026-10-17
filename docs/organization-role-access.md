# Organization role access

Platform administrators and super administrators can open an organization in the platform workspace and select **Manage organization role access**. Each organization has independent rules for ADMIN, MANAGER, OFFICE, ACCOUNTANT, CARETAKER, SECURITY, TENANT and LANDLORD.

Permissions can inherit their default, be explicitly allowed, or be denied. A role deny takes precedence over built-in permissions and individually delegated staff mandates. Allowances apply to the application's named permission checks; existing role, resource ownership, membership scope and tenant isolation checks still apply. This is not role impersonation or a way to give tenant accounts unrestricted staff access. Existing role-only workflows remain role constrained.

Blocked sections are hidden from shared workspace navigation and rejected for direct page requests and recognized scoped API routes. Restore defaults removes a role's overrides. Changes are read with each session request, saved transactionally, checked for concurrent edits, and recorded as `ORG_ROLE_ACCESS_UPDATED` audit events. Only platform administrators can write the dedicated settings field; ordinary organization feature updates cannot modify it.

## Deployment

Apply `prisma/migrations/20261017000000_org_role_access/migration.sql` through the normal migration deployment process before running the updated server. It adds the nullable `OrganizationSettings.roleAccess` JSONB column. Existing organizations retain their defaults when the field is null. The Prisma client has been regenerated locally. The migration was applied to the configured live database on October 17, 2026 using `prisma migrate deploy`. Other environments still need their normal migration deployment.

## Existing tenant onboarding

In tenant creation's unit/lease step, select **Onboard an existing lease**, choose the unit, and enter the original lease start date. Optionally enter the remaining unpaid balance for each of the last twelve completed Nairobi calendar months. Settled months remain blank or zero. The review step shows the entries and total.

Each positive monthly amount becomes an ordinary payable `OTHER` lease charge with an `Opening arrears` description. Initial rent/deposit charges are not recreated in this mode. Imported periods suppress forecast rent and unit fees in both bill rendering and combined payment allocation, so an entered outstanding amount is not inflated by a second full month's charge. Current/future bills follow normal billing. Outstanding imported balances carry into the organization ledger and tenant invoice history; verified payments reduce the existing charge balance. Where accrual accounting and automatic billing posting are enabled, imports debit tenant receivables and credit opening equity rather than booking new rental income. Imports are created atomically with the tenant/lease and have their own audit event.

Current-month arrears, credits, historic payments already made, and deposits already held are not imported by these fields; only remaining unpaid balances from the previous twelve months are recorded.
