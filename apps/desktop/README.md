# EstateDesk desktop

The desktop application loads the shared EstateDesk web workspace in a sandboxed Electron window. It supports the same accounts, organization permissions, responsive pages and backend operations. It requires the hosted backend; it does not bundle a local database.

From the repository root:

```sh
npm ci
npm run desktop:start
npm run desktop:test
npm run desktop:smoke
npm run desktop:package
```

For local development, start the web app separately and run `ESTATEDESK_DESKTOP_URL=http://localhost:3000 npm run desktop:start` (PowerShell: `$env:ESTATEDESK_DESKTOP_URL="http://localhost:3000"`). Packaged applications always use `https://estatedesk.co.ke`; development URL overrides are ignored.

Build on the target operating system. Windows produces an NSIS installer, macOS a DMG, and Linux AppImage and Debian packages in `apps/desktop/release`. The manual **Cross-platform artifacts** workflow builds unsigned review artifacts on all three operating systems and exports Android/iOS JavaScript bundles. It does not publish a release or submit an app to a store. macOS signing/notarization and Windows signing require publisher credentials before public distribution. Native mobile signing remains in `apps/mobile/eas.json`.

Remote content has no Node integration, preload bridge or IPC capabilities. Context isolation, process sandboxing and web security are enabled. Navigation stays on the configured origin; popup windows are blocked. External HTTPS links ask before opening in the default browser; other external protocols are blocked. Camera and notification requests require native consent from the trusted main window; other OS permissions are denied; file input and downloads use normal Chromium/Electron controls. Camera-only consent and Windows/macOS update checks are implemented. Remote push delivery, protocol handlers and target-device acceptance remain outstanding. Web content updates with the backend; Electron security updates require rebuilding installers and publishing the matching update artifacts.

The smoke check launches the source application against a temporary localhost fixture with an isolated profile. It verifies renderer isolation, sandbox preferences, notification denial, same-origin navigation, file selection, popup reuse and reload. It needs a graphical session (Linux CI uses `xvfb-run --auto-servernum npm run desktop:smoke`). The artifacts workflow runs it on all three operating systems before packaging. It does not access production accounts.

Validation still requires launching each packaged target binary, signing in with disposable role accounts, switching organizations, checking file upload/download and printing, testing zoom/keyboard/accessibility and network recovery, then verifying installer removal. Passing the source smoke check, policy tests or creating an installer does not certify these workflows.

## Desktop permissions and updates — 18 November 2026

The trusted main window can request camera-only capture and desktop notification permission through explicit native consent. Microphone, screen capture, foreign origins and embedded frames are denied. Grants last for the window session and are cleared when navigating to login. OS camera approval is still required. Desktop notification permission does not establish remote web-push support or delivery.

Packaged Windows/macOS clients check for updates at startup and every six hours, and expose Help → Check for updates. Download and restart each require confirmation. Publish signed installer/update files and manifests to `https://estatedesk.co.ke/downloads/desktop/` before relying on updates. The workflow retains ZIP, YAML and blockmap artifacts alongside installers. Linux package updates remain manual. A working feed and signed target-platform update acceptance are still required.

Implementation references: [Electron permission handling](https://www.electronjs.org/docs/latest/api/session) and [electron-builder updates](https://www.electron.build/v26/docs/features/auto-update/).
