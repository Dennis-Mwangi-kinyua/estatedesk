# Personal Security Centre

The personal security page is `/dashboard/security`. Organization staff and caretakers retain their existing workspace-specific security routes, with a shared password-protection panel. Personal security access now includes tenants, landlords, security staff, platform users and accounts without an organization, while existing section restrictions, setup and organization gates remain in force.

## Account protections

Self-service changes verify the current password and limit attempts to five per account in a 15-minute window. Self-selected passwords in signup, initial setup, reset and change flows require at least 12 characters. Passwords exceeding bcrypt's 72 UTF-8-byte limit are rejected rather than silently truncated. Existing credentials remain usable until changed; the login verifier still handles existing password hashes.

A successful password change, including required temporary-password setup, performs a compare-and-set update in one database transaction. It rotates the current session token hash, revokes the account's other sessions (and their native push registrations), invalidates outstanding reset links, updates `passwordChangedAt`, and records the password-change event. A current session from another account cannot authorize the operation. Concurrent changes using the same old credential accept only one replacement.

The browser receives a fresh signed, hardened cookie. The native security endpoint returns the renewed cookie only through the existing authenticated native transport; the app validates and saves it in SecureStore before refreshing. If storage or response validation fails, the app clears local account state where possible and requires sign-in rather than continuing with the revoked credential.

Forms retain entered values while the current password is corrected, clear password fields after success, disable duplicate submissions while pending, and provide accessible errors and confirmation. The existing tenant password page delegates to the same protected operation. Initial setup commits password protection and terms acceptance together; accepting terms without changing a password does not overwrite its hash or last-change timestamp.

## Private security history

The Security Centre and `/api/mobile/security/activity` show the owner's latest 25 allowed account events, password-change timestamp, device hints and recorded IPs. Successful sign-ins, sign-outs and resets use account-scoped events; unsuccessful password verification and self-service session revocations are also represented. Login/logout/reset logging is best effort; the successful password-change event is part of its transaction.

Events are filtered by the authenticated owner and an explicit event allowlist. The response projects display fields only: arbitrary audit metadata, before/after state, passwords and session credentials are excluded. Account-wide events use `orgId: null` so an organization purge does not erase account protection history. Device labels are user-agent hints, not authentication proof. Dates are displayed in Africa/Nairobi.

## Request and throttle hardening

Notification acknowledgement and browser logout validate the exact browser-facing scheme, host and port, reject cross-site browser requests, and retain their existing account/scope checks. Trusted reverse proxies must overwrite untrusted `X-Forwarded-Host` and `X-Forwarded-Proto` headers. Logout still requires the explicit application header and separates guest from user session removal.

The shared database limiter now creates, compares and reports reset windows using UTC database time. Prisma DateTime columns are timestamps without a timezone; comparing them to an implicitly localized database timestamp previously reset counters incorrectly on non-UTC database sessions. Application clock drift no longer controls the window. Missing rate-limit storage results fail closed.

## Presentation and compatibility

Organization security screens now reuse the common Security Centre instead of maintaining duplicate device UI. Shared session labels recognize native app/tablet agents, touch controls meet a 44 px minimum, and the public security overview describes implemented protections in clear language with a usable contact action.

The existing native security GET response remains compatible. Password-change and account-setup callers must save the renewed session cookie or sign in again. This pass adds the activity endpoint and uses existing tables; no schema migration is required. Current development artifacts include 52 native API handlers, including Today and security activity. Deploy the matching backend before distributing a matching native client.

See the development audit for verification results. JavaScript exports and browser/native-HTTP tests leave installed-device, keychain and accessibility-service acceptance to the device checks.
