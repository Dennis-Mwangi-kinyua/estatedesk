# EstateDesk Browser Extension

Manifest V3 companion for EstateDesk that keeps unread notification badges in sync and provides quick access to the web app.

## Package

From the repository root:

```bash
npm run extension:package
```

This creates `dist/estatedesk-browser-extension.zip`.

## Install locally (Chrome / Edge)

1. Build the package with `npm run extension:package`.
2. Unzip `dist/estatedesk-browser-extension.zip` into a folder, or use the `extensions/estatedesk` directory during development.
3. Open `chrome://extensions` or `edge://extensions`.
4. Enable **Developer mode**.
5. Choose **Load unpacked** and select `extensions/estatedesk`.

## Install locally (Firefox)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `extensions/estatedesk/manifest.json`.

## What it does

- Syncs unread in-app notification counts to the toolbar badge when an EstateDesk tab is open.
- Opens Dashboard, issue reporting, and vacancies through quick actions in `popup.html`.
- Uses the active EstateDesk site origin detected from open tabs, with `https://estatedesk.co.ke` as the default host.

## Development notes

- Update `extensions/estatedesk/config.js` if you need a different default site URL for local testing.
- The extension expects an authenticated EstateDesk session in the browser so `/api/pwa/badge-count` can return the current unread count.
- Re-run `npm run extension:package` before distributing an updated build.