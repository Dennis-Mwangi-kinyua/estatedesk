# Installable releases

## Build outputs

| Target | Output | Build route |
| --- | --- | --- |
| Windows | NSIS `.exe` | Cross-platform artifacts workflow on Windows |
| macOS | `.dmg` | Cross-platform artifacts workflow on macOS |
| Linux | `.AppImage`, `.deb` | Cross-platform artifacts workflow or local desktop packaging |
| Android testing | `.apk` | Mobile installable builds workflow, preview profile |
| Android Play Store | `.aab` | Mobile installable builds workflow, production profile |
| iOS testing | Provisioned `.ipa` | Mobile installable builds workflow, preview profile |
| iOS App Store/TestFlight | Signed production build | Mobile installable builds workflow, production profile |

JavaScript bundle artifacts are separate from installable binaries. Neither workflow publishes a public release or submits to stores. iOS preview builds require registered device provisioning; an IPA cannot be installed arbitrarily on any iPhone.

## Configure mobile builds

On an authenticated developer workstation, initialize/link the Expo project from `apps/mobile` using EAS CLI 18. Configure Android and iOS signing credentials interactively with `eas credentials` before running the non-interactive workflow. Apple provisioning requires the appropriate Apple developer access.

Set the repository secret `EXPO_TOKEN` and repository variable `EXPO_PROJECT_ID`. The project ID must identify the same Expo project used to configure credentials. The app reads it in `app.config.ts`.

Run **Mobile installable builds**, choose a platform and preview/production profile. The uploaded `mobile-build-results` JSON contains EAS build results and artifact URLs. Download the binary from the successful build; do not share credential material. EAS access and build capacity are prerequisites. Store submissions remain explicit separate operations.

Preview and production builds use `https://estatedesk.co.ke`. Deploy and verify the matching backend first; never test destructive workflows against real customer records.

## Desktop builds

Run **Cross-platform artifacts**. Download the per-operating-system artifacts after each job succeeds. Current workflow artifacts are unsigned review builds. Public Windows releases require publisher signing; macOS releases require Developer ID signing/notarization and Gatekeeper acceptance. Configure publisher credentials through protected CI secrets before adding signing to release automation.

On a target development OS, `npm run desktop:package` writes to `apps/desktop/release`. Desktop loads the hosted backend. It does not provide a local database or automatic binary updates.

## Acceptance before distribution

Install and uninstall each binary on its target operating system. Verify role sign-in, organization switching, session revocation, upload/download, printing or PDF sharing, network recovery, keyboard and screen-reader access. On mobile also verify camera/file permissions, CSV picker cancellation and invalid files, push delivery, and saved-draft recovery after an offline restart.

Record device, OS, application version, backend version, date and outcomes. A successful build or source smoke test does not substitute for installed-device acceptance.

## Current execution constraints — 18 November 2026

The inspected Linux environment has Linux desktop artifacts. Android doctor reports missing Java, platform/build tools, NDK, CMake and a device. iOS compilation requires macOS or cloud builds. GitHub authentication works with network access; the repository has no signing/Expo secrets or project variables configured. Signed Windows/macOS/mobile artifacts and physical-device acceptance have not been established.

## Signed desktop workflow

Select `signed=true` in **Cross-platform artifacts** to require signing rather than silently produce unsigned Windows/macOS installers. Configure `WINDOWS_CSC_LINK` and `WINDOWS_CSC_KEY_PASSWORD` for Windows. Configure `DESKTOP_CSC_LINK`, `DESKTOP_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` for macOS signing and notarization. Certificate links may contain the certificate representation supported by electron-builder; keep them in protected secrets. Linux packages remain unsigned review artifacts. Signed workflow execution has not yet been verified with publisher credentials.

## Scheduled delivery

Vercel configurations keep daily schedules only, so Hobby deployments are accepted. Frequent notifications use the separate `.github/workflows/notifications.yml` scheduler (opt-in) or a VPS scheduler calling `/api/cron/notifications` with `CRON_SECRET`. This invokes reminder generation, lease-signing lifecycle processing, queued channel delivery and native push receipt reconciliation. Deployment must support this schedule and supply `CRON_SECRET` and the relevant provider credentials. Configure the scheduler URL/secret and explicitly enable it before relying on delivery. The source configuration does not establish that the deployed scheduler has run successfully.

## Outstanding acceptance and feature work

- Native provider accept/decline/completion submission is now implemented in Today. Native inventory create/edit/delete was already present; focused authorization checks pass. Installed-device acceptance remains outstanding.
- Desktop camera/notification consent and Windows/macOS update code are implemented. Protocol handling, remote push delivery and live signed update acceptance remain outstanding.
- Windows/macOS and mobile signing builds need configured publisher accounts; all target binaries need installed-device acceptance.
- The production dependency audit on 18 November reported 33 advisories: 28 high, 3 moderate and 2 low. Suggested fixes include incompatible major-version changes; no forced upgrade was applied. Review the affected dependency chains and provider compatibility before release.
- Installer workflows currently exist locally and must be reviewed and pushed before GitHub can execute them. GitHub authentication was successfully verified with network access on 18 November.

## Desktop permissions and updates — 18 November 2026

The trusted main window can request camera-only capture and desktop notification permission through explicit native consent. Microphone, screen capture, foreign origins and embedded frames are denied. Grants last for the window session and are cleared when navigating to login. OS camera approval is still required. Desktop notification permission does not establish remote web-push support or delivery.

Packaged Windows/macOS clients check for updates at startup and every six hours, and expose Help → Check for updates. Download and restart each require confirmation. Publish signed installer/update files and manifests to `https://estatedesk.co.ke/downloads/desktop/` before relying on updates. The workflow retains ZIP, YAML and blockmap artifacts alongside installers. Linux package updates remain manual. A working feed and signed target-platform update acceptance are still required.

Implementation references: [Electron permission handling](https://www.electronjs.org/docs/latest/api/session) and [electron-builder updates](https://www.electron.build/v26/docs/features/auto-update/).
