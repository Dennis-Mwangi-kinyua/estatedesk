# Tenant parity in the iOS and Android apps

Implemented as native quick workflows plus the complete responsive tenant web workspace in an in-app WebView. The additional workflows are web screens inside the app, require connectivity, and reuse the website's pages, actions and authorization. No store binary or backend deployment was performed.

| Tenant area | App access |
| --- | --- |
| Overview, account/lease/payment history | Native home/leases plus complete workspace |
| Profile, next of kin, password and session security | Complete workspace |
| Community board | Complete workspace |
| Lease details, contract downloads and pending signatures | Native leases/documents plus complete workspace/signing |
| Payments, advance/partial payments, status, ledger and statements | Native bills/payments plus complete workspace |
| RentRewards and redemption | Complete workspace |
| Invoice history and PDF download | Native bills plus complete workspace |
| Expenditures and recording personal expenses | Complete workspace |
| Water bills and receipts | Native bills/documents plus complete workspace |
| Maintenance reporting, evidence, history and resolution confirmation | Native requests plus complete workspace |
| Inspection history and report downloads | Complete workspace |
| Received notices, move-out submission/withdrawal, settlement and reports | Native progress plus complete workspace |
| Notifications | Native feed/push plus complete workspace |
| Documents | Native PDF list/sharing plus complete workspace |
| Visitors | Native passes/sharing/revocation plus complete workspace |
| Help | Complete workspace |

`tests/unit/mobile-tenant-workspace.test.ts` compares the complete workspace menu against all tenant sidebar destinations. A new web menu destination requires a corresponding mobile entry. Entries do not authorize access: the underlying web guards enforce active leases, ownership, gate configuration, organization policy and setup requirements.

## Session and document boundaries

- Only a fixed backend bootstrap receives the existing signed mobile cookie header. It checks the live session, active tenant role, organization and setup gates. It sets an HttpOnly session cookie and serves a fixed same-origin continuation document. No credential appears in a URL, HTML or injected script, and no extra server login is created.
- A narrow proxy exception permits native top-level navigation to this bootstrap. Other API browser navigation retains its existing behavior. Browser Origin, cross-site and same-origin Fetch Metadata requests cannot use the bootstrap; initial native navigation with absent/`none` site metadata is accepted.
- The WebView uses incognito mode, disabled shared/third-party cookies and disabled caching. iOS uses nonpersistent storage; Android clears prior WebView cookies on creation. Native SecureStore credentials remain separate. Native logout revokes the shared server session; closing the web workspace revalidates it and resets loaded native workflow state.
- External HTTPS/email/phone links go to the device with no native headers; unsafe schemes are blocked. Signing routes remain inside the configured origin.
- A restricted document bridge captures PDF link clicks, including Android download anchors. Native code independently validates origin and route, fetches with the current session, rejects redirects/non-PDF data/oversized files, and opens the native share sheet. Existing web download ownership checks and audits apply. Generic web messages cannot request arbitrary authenticated URLs.

## Validation

- Web TypeScript and targeted web lint passed.
- Mobile TypeScript passed.
- 21 focused unit tests passed, covering the existing mobile boundaries, workspace roles, session cookies, menu parity, bootstrap request policy, entry-point validation, unsafe navigation and document URL scope.
- Expo dependency check matches the installed SDK's local map (`react-native-webview` 14.0.1). The online well-known-version endpoint was unavailable.
- Both iOS and Android JavaScript/Hermes exports passed.
- Two Playwright checks passed: unauthenticated native bootstrap returns 401, and ordinary browser API navigation retains its redirect. The authenticated-cookie/browser-continuation test is provided but was skipped because a disposable local test backend was not explicitly selected. No production tenant account or database was used to exercise mutations.

Reproduce the focused checks:

```sh
npm run mobile:typecheck
npm run typecheck
npm run check -w @estatedesk/mobile
node --import tsx --test tests/unit/mobile-tenant-workspace.test.ts tests/unit/mobile-api.test.ts tests/unit/mobile-workspaces.test.ts tests/unit/mobile-expansion.test.ts tests/unit/session-cookies.test.ts
npm run test:e2e -- tests/e2e/mobile-tenant-workspace.spec.ts --project=chromium --workers=1
cd apps/mobile
npx expo export --platform ios --platform android --output-dir /private/tmp/estatedesk-tenant-parity-export
```

For the authenticated browser check, supply a fictional `ROLE_WORKSPACE_FIXTURE` and set both `DATABASE_URL` and `TEST_DATABASE_URL` to the same disposable localhost database with `test` in its name before starting Playwright/the backend.

## Native release validation

Rebuild both development clients with the new WebView module, deploy the bootstrap and proxy change, and validate on iOS/Android devices: initial cookie handoff, first-page loading, expiry/revocation/logout, account and organization changes, web mutations and validation errors, signature drawing, file selection, document sharing, Android back, interrupted loading/offline retry, small screens and VoiceOver/TalkBack. JavaScript exports do not prove these native behaviors. Existing native visitor/push/photo workflows remain available. No native build, store upload or production release was performed in this task.
