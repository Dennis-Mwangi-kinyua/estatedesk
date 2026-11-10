# Cross-platform development checks — 10 November 2026

This records local development verification. No deployment, store submission, or signed mobile distribution was requested or performed.

## Changes

- Fixed static offline recovery: border-box sizing prevents narrow-screen overflow, the retry link meets a 44 px minimum target, and dark-mode styles now follow base styles so they take effect. The retry link has a visible keyboard-focus outline.
- Raised the rendered offline page's retry target to the same minimum.
- Bumped the PWA static-cache version to `0.2.5` so updated clients can receive the corrected recovery screen.
- Added actual browser recovery tests, including 320 px phones, 768 px tablets, 200% text, light/dark mode, keyboard focus, offline navigation, reconnection, and absence of cached API/dashboard/platform pages.
- CRM browser fixtures accept an explicit cookie name, require HTTPS when testing production `__Host-` cookies, and dismiss the normal product-update dialog before exercising forms.
- The portable Android installer can install SDK command tools independently with `--sdk-tools-only` when a JDK is already provided.

## Verified

Forty distinct development scenarios passed across the final targeted runs:

- 21 desktop/mobile cases covering public form labels and themes, navigation focus/Escape behavior, reduced-height login, readable laptop layouts, tenant cards, responsive table presentation, touch signatures, native CRM APIs, and the new offline recovery tests.
- 16 secure-session/native workflow cases: ten role sign-ins plus tenant/staff/property isolation and pagination, owned payment receipts, field evidence with retry acknowledgements, visitor admission/revocation, and tenant community/expenses/profile ownership.
- Three corrected browser cases: desktop/mobile CRM sales, demos, portal communication, task editing/completion and reports; password change, invitation replay, expired-session and subscription gates.

Seven project-specific cases were intentionally skipped: the desktop-only absence of mobile navigation, and six native API scenarios that run once rather than repeat in the mobile-browser project. These skips are not additional device coverage.

Web and mobile TypeScript checks passed. PWA unit checks passed. The web production build compiled and generated 879 pages. Both artifact source fingerprints match the application source and all 50 native API handlers remain present. The first sandboxed build could not launch the TypeScript configuration subprocess; the permitted retry succeeded.

The signed-in scenarios used fictional records in the guarded disposable local `estatedesk_crm_test` database. Outbound email was disabled. A temporary localhost HTTPS proxy and private one-day certificate allowed real secure browser cookies; HTTP cannot stand in for production `__Host-` cookie transport. Fixture seeding must use the same temporary `AUTH_SECRET` as the test server, including for invitation hashes. No production database mutations were performed for these checks.

## Still outside this evidence

The portable JDK and SDK command-tool downloads were resumed and made progress, but installation/build success has not yet been established. `mobile:doctor` still reports missing native prerequisites until extraction and SDK-package installation complete. The environment has no `/dev/kvm`; an authorized Android phone or a host with emulator acceleration is needed for practical device verification. iOS compilation/execution needs macOS with Xcode.

Browser mobile emulation and native HTTP workflow tests do not verify a React Native binary, physical camera/file permissions, actual push delivery, VoiceOver/TalkBack, or native-process crashes. These checks remain necessary after the native app can run.

## Highest-value next product improvement

Extend the existing organization operating queue and notifications into a personal **Today** view across all roles and native clients. Show each user's urgent work, due dates, ownership and direct next action, within existing role and property/organization permissions. Reuse current tasks, notifications and workflow records; opening an item must not imply completing it. Native drafts and clear save/send/approval results should remain part of that same reliable workflow.
