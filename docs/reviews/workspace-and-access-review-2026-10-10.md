# Organisation, tenant and role-management review

Reviewed local source on 2026-10-10. These are findings, not completed authorization fixes. The accompanying UI change standardizes semantic SVG icons and their presentation only. No production accounts were changed during the review.

## Fix first: authorization

1. **Critical — platform admin actions lack their own authentication and authorization checks.** `apps/web/src/app/(app)/platform/admins/_lib/actions.ts` exports `createPlatformAdmin` and `deletePlatformAdmin` without calling a session or platform permission guard. Creation accepts `SUPER_ADMIN`, `isRootSuperAdmin`, and `canCreatePlatformAdmins` from form data. Layout checks cannot protect a server action. An isolated execution with mocked persistence confirmed creation reaches the write with root privileges and without a session guard. Add action-level actor validation, enforce provisioning permission and permitted target roles, and restrict root provisioning to a deliberate policy.

2. **High — organisation membership editing can promote a manager to admin.** `apps/web/src/features/staff/actions/update-membership.ts` checks the current organisation but never `org.users.manage` or the actor's authority to assign a role. `/staff` admits managers and the edit form offers ADMIN. A mocked execution confirmed a manager membership could be promoted to ADMIN. Require the permission before all profile/role writes, validate the requested role, protect privileged targets, record the change, and refresh affected access/session state.

3. **High — platform permission overrides are not enforced by the shared guards.** `apps/web/src/lib/permissions/guards.ts` checks platform role membership; `workspace-access.ts` admits platform roles across platform routes. `platformPermissions` and `canCreatePlatformAdmins` are saved/displayed but are not consulted by these guards. A displayed revocation therefore does not establish a restriction. Centralize effective platform access and enforce it on pages, actions, and APIs.

4. **High — organisation admin removal has no self/last-admin protection.** The staff membership deletion/deactivation actions do not check whether they remove the last active organisation admin. Add transactional checks to prevent administrative lockout, including concurrent removals. This item is source-reviewed; no account-removal simulation was run.

## Tenant experience and access

5. **Security links lead to a route the tenant allowlist rejects.** Tenant navigation and profile guidance link to `/dashboard/security`; `apps/web/src/lib/permissions/access.ts` omits it from tenant workspace paths. The access function confirms it returns false. Make the permitted security route and the navigation agree, retaining self-account scope.

6. **Past-lease history and account maintenance disappear after move-out.** Only tenant overview and profile are history-only paths. Lease, receipts/payments, documents, move-out results, and nested profile edit/password routes require an active lease. The profile's “View lease history” link consequently sends a former tenant back to the overview. Separate self-account access and historical records from operations requiring a current tenancy; retain tenant/organisation ownership checks.

7. **Tenant shell lookup does not use the selected organisation.** `apps/web/src/lib/tenant/get-current-tenant.ts` queries `tenant.findFirst` by user ID and deletion state, without `session.activeOrgId` or deterministic ordering. A user with records in multiple organisations can receive a shell/lease state for a different organisation than the scoped page. Scope both shell and active-lease lookups to the chosen organisation. This is a source-confirmed context mismatch risk; no cross-organisation production data access was tested.

## Organisation and platform usability

8. **Dashboard cards/actions do not consistently follow role access.** Organisation stats and snapshot cards link to staff, leases, units, reports, and accounting without filtering for the actor's role. Accountants and office staff can see actions that the route/action guards reject. Office users can be offered Add property although property creation requires `properties.manage`. Derive visible cards and actions from the same permissions as their destinations.

9. **Platform user management currently provides read-only inspection.** In `apps/web/src/app/(app)/platform/users/[id]/actions.ts`, each mutation first calls `blockReadOnlyUserMutation`, which redirects unconditionally. The rendered profile displays account and permissions information; unused editing components do not provide an operational management workflow. Organisation settings similarly provide invitations and a member table while role editing lives separately under staff. Make supported operations and effective access clear in each workspace; do not imply permission editing is available until guarded mutations exist.

10. **Organisation dashboard repeats too many summaries.** Header metrics, quick actions, seven statistic cards, role panels, snapshot signals, and activity create a long mobile page with repeated numbers and destinations. Consolidate around the user's main tasks, use fewer equally sized summary cards, and move secondary signals below the primary work area. The tenant dashboard/profile received card-layout improvements in the preceding release; the broader organisation composition still needs this work.

11. **Staff pages can mislabel the signed-in operator.** `apps/web/src/app/(app)/staff/layout.tsx` supplies the organisation role to `OrgDashboardShell` but omits `userName` and `userRole`, allowing fallback identity labels. Pass the authenticated operator's identity and actual role.

## Completed visual work

Shared navigation, headings, metric masks, quick actions and role panels now use one Lucide outline vocabulary. Inspections, maintenance, invoices, payments, documents, leases, notices, notifications, profiles, teams and permissions have distinct symbols. Remaining UI emoji were replaced in setup forms, mobile profile fields, property/lease cards and platform messaging. Icon tiles use consistent sizes and theme-aware colors; adjacent text remains the accessible label.

To regenerate CSS masks after changing the icon registry, run:

```sh
node --import tsx scripts/generate-workspace-icon-masks.ts
```
