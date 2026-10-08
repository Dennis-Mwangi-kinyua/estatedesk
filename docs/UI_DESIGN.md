# Shared presentation

The root layout applies `site-experience.css` to public pages, account pages, and every role workspace. It complements the existing theme tokens and shared card components. Shared inputs and buttons use larger mobile sizes; headings wrap long names; cards, expandable details, and focus indicators share consistent styling.

The shared `SiteExperience` component adds decorative page-heading icons and column-label metadata to simple data tables after hydration. On phones, these tables display as labeled record cards. Existing controls, links, table content, and explicit ARIA roles remain in place. Newly rendered rows receive labels through a coalesced mutation observer. Desktop tables retain their column layout.

Tables with grouped headers, spanning body cells, or footer totals retain their authored table presentation. Set `data-table-layout="comparison"` on any table that should keep its comparison layout. Print routes are excluded from enhancement, and the card layout is limited to screen media.

44 page headers use shared compact presentation; workflow guidance is expandable where present. 40 workspace layouts defer guidance sidebars until the desktop breakpoint, leaving more space for primary content on phones and tablets.

Validation uses desktop and mobile browser fixtures for dynamic tables, controls, all four role overviews, platform payments, portfolio directories, and tenant/unit setup. Public pages are checked in both themes for overflow, form labels, navigation focus, and small-screen login usability. These are representative browser checks; each authenticated route is not individually loaded against production data.
