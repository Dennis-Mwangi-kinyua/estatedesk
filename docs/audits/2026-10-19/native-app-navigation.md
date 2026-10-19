# Native app navigation — 19 October 2026

The current mobile client renders React Native screens and native forms. Website route strings in menu responses identify API-authorized tools; they are not browser navigation. Tenant tools map to native screens. Organization and platform tools use native record lists, full-screen detail pages and native action forms.

Organization details now expose a DPA agreement entry. Where an agreement exists, selecting it fetches that exact agreement and opens its full native detail page. Signing, revision, reminders, cancellation and PDF download use the existing native actions. The API retains menu authorization and organization/status filters when selecting an agreement by ID. Restricted related destinations are omitted.

The unused authenticated website bootstrap helpers and the WebView package dependency have been removed from the client. PDF documents are fetched with the session and opened/shared through device facilities. They do not navigate to website pages.

Independent of the website frontend does not mean independent of the API: live records, account checks and mutations require the backend. Existing offline field drafts remain available; this change does not implement full offline operation.

Validation includes mobile/server TypeScript, targeted native API unit tests and an Android development bundle. Full authenticated device coverage across every role, mutation, file picker and signature flow remains required; passing browser emulation or JavaScript bundling alone does not establish it.

The connected Android emulator loaded the updated 982-module bundle, but repeated system-level “System UI isn’t responding” dialogs prevented reliable interaction. Authenticated DPA navigation on an Android device has not yet been verified. Fifteen focused unit tests and mobile/server type checks passed.


## Android emulator crash recovery

The emulator crash buffer showed a fatal Android system-process failure after losing the network stack, followed by System UI, Settings and permission-controller failures. This buffer did not identify an EstateDesk application crash.

Cold booted `Medium_Phone_API_37.0` without loading or saving snapshots. Increased its configuration from one core / 2048 MB RAM to four cores / 4096 MB RAM, and enabled cold boot for subsequent Android Studio launches. The previous AVD config is backed up beside it as `config.ini.before-crash-fix`. Installed app data was retained.

After recovery, Android completed boot, EstateDesk loaded its native sign-in screen, and tapping Account help revealed the expected native help content. The crash buffer remained empty through launch and interaction. Signed-in workflows were not exercised during this recovery check.
