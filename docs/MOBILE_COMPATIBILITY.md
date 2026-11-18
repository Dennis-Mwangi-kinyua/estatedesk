# Mobile compatibility and acceptance

Reviewed: 17 November 2026.

## Supported experiences

The full Next.js app targets Chrome/Edge/Firefox 111+ and Safari 16.4+, matching the installed framework’s `modern-browserslist-target.js` and [official browser documentation](https://nextjs.org/docs/architecture/supported-browsers). Browser versions, available memory and OS capabilities determine support; phone age alone does not. Tailwind’s modern CSS also prevents a credible promise of full support for obsolete browsers.

`/basic.html` is a plain HTML/CSS public overview with no scripts, images, external stylesheets, web fonts or framework hydration. It is intended for older browsers, low-memory phones and limited connections. It uses normal links to the full site, where the modern-browser requirement applies. It is `noindex,follow` to keep duplicate summary content out of search. It is not an offline database or alternate authenticated app. Historical phones and proxy browsers still need physical testing; no universal compatibility claim is made.

## Implementation rules

- Start at 320 CSS pixels, then expand through 360/390, tablet and desktop. The basic overview is also checked at 240 pixels.
- Keep public text, links, headings and feature structured data in server HTML. Do not replace mobile content with reduced marketing claims or block it behind interaction.
- Use a single column by default; add columns only when there is space. Allow long labels to wrap and keep native table scroll containers.
- Preserve pinch zoom. Public mobile form fields use at least 16px text and 44px height; buttons and disclosure controls have a 44px height floor.
- Use `100vh` before `100dvh`, system fonts and responsive media. Do not hide page overflow to conceal broken layouts.
- Respect reduced motion and reduced transparency. Hardware APIs and PWA installation are enhancements, not requirements for reading public content.
- Do not automatically redirect by user agent: link explicitly to the basic overview from the public footer and feature page.

## Verification

Run `npx playwright test tests/e2e/features-mobile-seo.spec.ts tests/e2e/public-mobile-navigation.spec.ts --project=chromium --workers=1`. The feature suite checks server content without JavaScript, canonical/indexability, sitemap/discovery coverage, 320–1440px layouts, enlarged text and the resource-free basic overview.

Browser emulation does not test an old CPU, old browser engine or real touch/assistive technology. Before claiming broad device acceptance, run sign-in, organisation switching, collections, imports, forms, camera/upload, keyboard, network interruption, session revocation and logout on representative Android phones and iPhones. Include a low-memory Android phone, the minimum supported iOS Safari version, a current phone, tablet, TalkBack/VoiceOver and 200% text. Record browser/OS versions and failures. Native app acceptance remains in `CROSS_PLATFORM_READINESS.md`.

Measure performance on the deployed production build with mobile network/CPU throttling, then confirm on hardware. Track 75th percentile LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 as goals, not results inferred from layout checks. JavaScript size, memory and authenticated workflow timings need their own measurements.
