# Native cards, Account and feature parity — 19 October 2026

## Implemented

- Tenant shortcuts/services, organisation features, field tools, platform admin/developer tools and related tools share one native feature-card component. Cards use aligned icon rows, consistent titles and spacing, readable descriptions, and full-card touch targets. Existing measured grids retain two phone columns and expand on tablets; large accessibility text retains the single-column layout.
- Bundled Ionicons outline artwork replaces the Feather renderer through the shared icon component. All 66 configured artwork names exist in the installed glyph map. No runtime icon download or website is required.
- Tenant headings and card text align consistently to the left. Recent platform activity has an icon column and a separate text column.
- Every role can open My account. Tenants use the Account tab; other roles use a native Account page. Sign out lives in Account/Profile on Android and iOS. The mandatory initial setup screen retains sign out for accounts unable to enter the application yet.
- Organisation completion reports now have a native list and full detail page. Submitted reports expose native approval/return forms, reuse the web review actions, check role and assigned unit scope, bind the reviewed version, and verify the persisted outcome before reporting success.

## Validation

- Mobile and web TypeScript checks passed; targeted server lint passed.
- 36 route, role/menu, account-service, grid and native-query/review tests passed in the combined run.
- Two UI tests cover card layout at 320, 390 and 768 pixels and Account security/logout interactions using Android/iOS host stand-ins. Three existing UI tests cover native record navigation, refresh/error recovery and Android/iOS screen retention. Host stand-ins do not constitute full device validation.
- Both iOS and Android Hermes exports completed with the bundled Ionicons font.
- Android's crash buffer was empty during the update check.

## Full web parity remains incomplete

The presence of a native destination does not establish complete workflow parity. Existing native pages cover the web navigation and many actions, but several organisation pages remain record browsers. Further work is required for the complete buildings/tenant/lease lifecycle, staff and permission editing, accounting transactions and financial reports/exports, imports, short-stay management, and workspace configuration. Organisation search currently covers units and properties; predictive insights are not implemented in the native view. Platform API exploration currently displays the endpoint catalog and integration readiness; this does not implement a full request console.

These features must be implemented with domain permissions, scope checks, validation and signed-in tests before declaring every web feature available in the apps. The app and updated backend routes must be deployed together. No production backend or store binary was published by this change.

## Native visual inspection

An isolated Expo preview in `/private/tmp/estatedesk-native-design-preview` rendered the production FeatureCard, IconTile, navigation and AccountPage components with fictional data. Inspected the actual Android phone and iOS iPad renders: two phone columns, three tablet columns, aligned cards and colourful bundled icon tiles. Android's Account tab opened the native identity, profile/security actions and Sign out area; its crash buffer remained empty. This preview has no backend or live account access and does not establish signed-in feature parity.

Screenshots: `/private/tmp/estatedesk-color-cards-android.png` and `/private/tmp/estatedesk-color-cards-ios.png`.
