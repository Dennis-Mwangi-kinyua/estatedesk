# Release implementation evidence — 18 November 2026

## Changes

- Native Today job cards carry optional structured provider job identity and status. Mobile providers can accept/decline assignments and submit completion notes through confirmed native controls.
- `POST /api/mobile/provider/jobs` uses the native session/setup/rate-limit boundary, bounded discriminated JSON input and the existing provider transaction services. Provider identity is resolved from the session; job ownership and eligible transitions are checked in the service.
- Native inventory create/edit/delete already existed. Focused native inventory authorization checks passed; earlier descriptions of inventory editing as wholly missing were inaccurate.
- Desktop camera-only and notification consent is limited to the trusted main frame. Other permissions, foreign origins, embedded frames and audio capture are denied. Grants clear on login navigation.
- Windows/macOS packaged clients check for updates and require confirmation for downloads and restart. The workflow retains manifests, blockmaps and macOS ZIP files. A public signed release feed is still required.
- A same-major XML parser override addresses its reported advisory. Unpatched/major-change Expo and React Native dependency chains remain under review.

## Executed validation

- Web and mobile TypeScript checks passed after provider implementation.
- Provider completion browser test passed: notes and explicit confirmation precede submission.
- Provider/Today policy and native inventory/operator tests passed.
- All 95 migrations applied to a disposable PostgreSQL 18 database under `/tmp` on port 55439.
- Provider lifecycle and Today integration tests passed, including foreign-provider rejection, transaction races, recipient/organization isolation and owner-only job retrieval (3 scenarios).
- Desktop policy, permission and update-consent tests passed.
- Electron source smoke check passed after permission and update wiring.
- Updated Linux AppImage and Debian installers built successfully. Installed binary/device acceptance remains separate.

## External state

GitHub authentication was verified. Repository secret names and repository variable names both returned empty lists. The new installer workflows are local and have not been pushed or executed remotely. No signed mobile, Windows or macOS binary was produced, no release feed was published, and no store submission was made. No production database or customer records were used for the integration checks.

Required external configuration and acceptance steps are in [installable releases](../../INSTALLABLE_RELEASES.md). Real camera/push behavior, signed upgrade execution and installed-device acceptance remain outstanding. Dependency audit counts should be read from the final audit execution, rather than inferred from an earlier npm installation summary.

Final production audit: {'info': 0, 'low': 0, 'moderate': 3, 'high': 28, 'critical': 0, 'total': 31}. The XML parser advisory is absent after the override. Remaining advisories are release blockers pending upstream-compatible fixes or an explicit documented assessment.
