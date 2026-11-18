# EstateDesk visual system

EstateDesk uses deep estate green (`#14634e`) as its primary brand color, white surfaces, a soft neutral green canvas, and dark green text. The same light palette drives desktop web, mobile web/PWA, and the native iOS and Android application. Web dark mode uses green-tinted surfaces and a lighter green action color with dark text.

## Source of truth

Edit `packages/design-tokens/tokens.json`, then run `npm run design:tokens`. Commit both generated files. `npm run design:check` detects drift between the web and native output. Do not edit generated files directly. The native theme remains light to match its current Expo configuration; dark native behavior requires a separate implementation.

## Controls and layout

- Primary: the main action on a page, solid green.
- Secondary/outline: supporting actions, soft or white surfaces.
- Ghost/link: navigation and low-emphasis actions.
- Destructive: red with an explicit action label.
- Status: preserve warning/error/success meaning; never rely on color alone.

Shared web controls have a minimum 44px height and native controls use 50px. Use 12px control radii, 18px cards, and 24px larger panels. Space content in multiples of 4px. Keep native system typography and the web system font stack; inputs remain at least 16px to avoid iOS focus zoom. Keep visible keyboard focus and respect reduced motion. Preserve safe-area insets and existing responsive navigation.

## Verification

The design-token test checks normal text contrast at 4.5:1 and input/focus contrast at 3:1 for both palettes. Theme cascade browser tests exercise the actual combined CSS in desktop and phone viewports, with light/dark themes, control variants, and keyboard focus. These checks cover the shared system; they do not establish full WCAG conformance for every route or replace native device testing.

## Adoption

Prefer semantic Tailwind classes (`bg-primary`, `text-primary-foreground`, `bg-card`, `text-muted-foreground`) and the shared Button component. Native components should use `mobileTheme` rather than hardcoded colors. Legacy page-specific decorative colors still need individual review when those pages are redesigned.
