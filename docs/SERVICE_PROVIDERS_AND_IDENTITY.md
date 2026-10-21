# Service providers, identity checks and retained tenants

Apply the committed Prisma migrations and regenerate the client before deployment. These changes have been tested against a disposable local PostgreSQL database; they do not apply themselves to production.

## Provider marketplace

- `/service-providers`: public directory with service and location filters.
- `/service-providers/register`: create a username/password account or add a provider profile to an existing signed-in account. New profiles remain pending until the account email is verified and a platform administrator approves the application. Approval sends the provider a sign-in email. IDs remain private.
- `/provider`: edit a profile, add portfolio projects, apply for jobs, accept offers and submit completion notes.
- `/dashboard/org/service-providers`: authorised operations staff post jobs, review applications, hire, confirm completion, rate work and report hired providers.
- `/platform/service-providers`: platform admins review pending applications, verify the applicant's email status, approve providers, and monitor activity and reports. Approval and later moderation decisions record reasons in audit history.

Provider signup uses the shared `/login` page. Pending provider-only accounts cannot sign in to the provider portal; after approval, the same username or email and password route them to `/provider`. Apply the service-provider approval migration before deploying the application because new registrations use the `PENDING` provider status.

Online means visible provider-portal activity in the previous five minutes with a valid user session. Availability for work is a separate provider setting. The marketplace does not process payments; scope, timing and payment terms are agreed directly. Ratings are unique per job and require the hiring organisation to confirm submitted work. Removal blocks provider access and removes portfolio content; underlying account identity, job and report history are retained, including any unrelated organisation memberships.

## Unique national IDs

IDs are normalised to uppercase letters/digits, ignoring spaces and hyphens. An `IdentityClaim` reserves each normalised ID for one account/person across tenants, staff, landlords and providers. Database triggers protect direct writes, imports and concurrent registration. Soft-deleted profiles keep their reservation. Existing ambiguous legacy IDs are not silently merged; platform reviewers must resolve conflicting or unlinked records before approving.

Organisations request review at `/dashboard/org/identity-verification`. Platform administrators authenticate identity and consent, record evidence/notes and approve or reject at `/platform/identity-verification`. Approved requests are scoped to the requesting organisation and role, then consumed once by “Continue registration — link verified account”. Linking reuses the existing account and password. Tenant profiles remain distinct per organisation; the same verified user may have one tenant profile in each organisation. Tenant data lookups must always include the session’s active organisation.

Authentication is a recorded manual platform review, not an external government-ID verification integration. No approval authorises two different people to share an ID. Staff account links require an organisation admin. Unit allocations and staff mandates remain separate steps.

## Retained tenant accounts

After move-out, `/dashboard/tenant/history` exposes the tenant’s own leases, payments, rent charges, water bills, inspections, maintenance requests and communications in their active organisation. Current-property operations still require an active lease. Past tenants are labelled explicitly and receive a history navigation entry.

The organisation tenant-detail screen offers a reinstatement form when there is no active lease. It creates a fresh lease and initial charges, restores active tenant status and preserves prior leases and payments. The previous unit is preferred if vacant; occupied or unready units cannot be allocated. Tenant and unit updates are locked atomically to prevent competing allocations.

Current tenants’ dashboards show previous occupants for their own unit only. The server response contains only `name` and `durationDays`, with no IDs, contacts, bills or report links.

## Product announcements

Append released updates to `apps/web/src/features/updates/catalog.ts`, giving each a new stable ID and explicit audiences. The matching signed-in portals automatically show the list as new until the account acknowledges it. `ProductUpdateRead` stores acknowledgements per user and update ID. Do not reuse an old ID for new content. This notice is separate from official apartment communications and PWA application updates.
