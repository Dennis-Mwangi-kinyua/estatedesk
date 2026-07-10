import type { GuideArticle } from "@/lib/guides/types";

/**
 * Authenticated workspace help (org / tenant / caretaker / platform admin).
 *
 * Rules:
 * - Always set privateInApp and/or privatePlatform so nothing appears on
 *   public /guides, sitemaps, or llms.txt.
 * - Do not include secrets, env var names, internal file paths, database
 *   internals, nuclear confirmation phrases, or other personas' private
 *   workflows (e.g. tenants must not see how staff verify payments step-by-step
 *   beyond "your property team reviews manual payments").
 * - Prefer product language over engineering architecture.
 */
export const workspacePrivateGuides = [
  // ─── Tenant ─────────────────────────────────────────────────────────────
  {
    slug: "tenant-portal-getting-started",
    category: "Tenant",
    privateInApp: true,
    title: "Getting started in the tenant portal",
    summary:
      "How to sign in, find your home dashboard, bills, issues, lease, and profile—without needing staff tools.",
    readingMinutes: 7,
    publishedAt: "2026-07-10",
    keywords: ["tenant portal", "tenant dashboard help"],
    sections: [
      {
        heading: "What this portal is for",
        paragraphs: [
          "The tenant portal is your private home for rent and water balances, payments, maintenance requests, lease documents, and notices from your property team. It only shows information tied to your tenancy.",
          "You will not see other tenants' data, staff settings, or organization management tools. That separation protects your privacy and theirs.",
        ],
      },
      {
        heading: "First sign-in checklist",
        paragraphs: [
          "Use the login link your property team shared. If you are asked to change a temporary password, do that before continuing.",
          "Confirm your phone number and profile details so payment prompts and alerts reach you. Update the profile page if your contact information changes.",
        ],
      },
      {
        heading: "Main areas you will use",
        paragraphs: [
          "Home or dashboard shows a snapshot of balances, open items, and recent activity. Payments (or Bills) is where you review rent and water for the current period and start Pay Now. Issues is for maintenance requests. Lease and notices cover documents your team shares with you.",
          "Help (this section) stays available from the sidebar so you can re-open guides anytime.",
        ],
      },
      {
        heading: "Privacy tips",
        paragraphs: [
          "Sign out on shared devices. Do not share your password with roommates or agents—ask your property office to grant separate access if someone else needs a portal account.",
          "Treat payment confirmation codes and SMS receipts as private. Share them only inside the official payment form when your team asks for a manual payment reference.",
        ],
      },
    ],
    takeaways: [
      "The portal only shows your tenancy—not other tenants or staff tools.",
      "Keep contact details current so alerts and payment prompts reach you.",
      "Use Help from the sidebar whenever you need a refresher.",
      "Never share your password; use official payment screens for codes.",
    ],
    relatedGuideSlugs: [
      "tenant-paying-your-bills",
      "tenant-maintenance-requests",
      "tenant-lease-documents-notices",
    ],
    relatedLinks: [
      {
        title: "Tenant dashboard",
        href: "/dashboard/tenant",
        description: "Return to your home overview.",
      },
      {
        title: "Payments",
        href: "/dashboard/tenant/payments",
        description: "Review balances and pay.",
      },
    ],
    faq: [
      {
        question: "I cannot see another unit I used to rent.",
        answer:
          "The portal focuses on your active tenancy with this organization. Contact your property office if you need records for a previous unit.",
      },
      {
        question: "Who do I contact for account access problems?",
        answer:
          "Your property office or landlord team manages tenant accounts. Use the contact details they provided outside this help guide.",
      },
    ],
  },
  {
    slug: "tenant-paying-your-bills",
    category: "Tenant",
    privateInApp: true,
    title: "Paying rent and water bills",
    summary:
      "How combined period bills work, how to pay in full or part, and the difference between instant M-Pesa and manual payment proof.",
    readingMinutes: 10,
    publishedAt: "2026-07-10",
    keywords: ["tenant pay rent", "tenant water bill", "M-Pesa tenant"],
    sections: [
      {
        heading: "Your period bill",
        paragraphs: [
          "Many months you will see one bill card that combines rent and water for the same month (for example March 2026). The card shows what you already paid and what is still due.",
          "You can usually pay the full remaining balance or enter a partial amount if your property team allows it. Always check the amount shown before confirming.",
        ],
      },
      {
        heading: "Pay Now and choosing a method",
        paragraphs: [
          "Pay Now opens a method chooser. Options depend on what your property has enabled—common choices are instant M-Pesa (phone prompt) and manual M-Pesa or bank (you paste a code or reference).",
          "Pick the method you actually used or will use. Mixing methods (for example paying by bank then selecting M-Pesa) can delay confirmation.",
        ],
      },
      {
        heading: "Instant M-Pesa (phone prompt)",
        paragraphs: [
          "When you choose instant M-Pesa, enter the phone number that should receive the payment prompt, confirm the amount, and approve the request on your phone with your PIN.",
          "After a successful approval, your bill balance usually updates automatically. Keep the phone nearby until the prompt appears. If nothing arrives, wait a minute, check network coverage, then try again or contact your property office.",
        ],
      },
      {
        heading: "Manual payment proof",
        paragraphs: [
          "If you pay through a paybill, till, or bank transfer yourself, choose the matching manual method and enter the confirmation code or reference exactly as it appears on your SMS or bank receipt.",
          "Manual payments stay pending until your property team confirms them. That is normal—not a failed payment. You can still see the pending entry in your payment history while you wait.",
        ],
      },
      {
        heading: "What you will not see",
        paragraphs: [
          "You will not see staff verification queues, other tenants' payments, or organization bank settings. Those belong to your property team. If a balance looks wrong after a successful payment, contact the office with your payment date, amount, and reference—not strangers or unofficial agents.",
        ],
      },
    ],
    takeaways: [
      "Period bills often combine rent and water for one month.",
      "Instant M-Pesa usually clears after you approve on your phone.",
      "Manual codes stay pending until the office confirms—by design.",
      "Never share payment codes outside the official payment form.",
    ],
    relatedGuideSlugs: [
      "tenant-portal-getting-started",
      "tenant-maintenance-requests",
    ],
    relatedLinks: [
      {
        title: "Start a payment",
        href: "/dashboard/tenant/payments/new",
        description: "Open the payment method chooser.",
      },
    ],
    faq: [
      {
        question: "Can I pay only water or only rent?",
        answer:
          "Often the bill is combined for the month. Partial amounts may still be accepted; how they apply to rent vs water is handled by your property team according to their policy. Contact them if you need a special allocation.",
      },
      {
        question: "My manual payment is still pending.",
        answer:
          "Pending means the office has not finished confirming the reference yet. Share your confirmation SMS with the office if they ask. Do not submit the same code twice.",
      },
      {
        question: "I was charged twice.",
        answer:
          "Stop retrying. Note both references and contact your property office so they can review your payment history safely.",
      },
    ],
  },
  {
    slug: "tenant-maintenance-requests",
    category: "Tenant",
    privateInApp: true,
    title: "Reporting maintenance and tracking issues",
    summary:
      "How to report a problem, add useful detail, and follow status updates without relying only on chat screenshots.",
    readingMinutes: 7,
    publishedAt: "2026-07-10",
    keywords: ["tenant maintenance", "report issue tenant"],
    sections: [
      {
        heading: "When to use Issues",
        paragraphs: [
          "Use the Issues area for repairs and maintenance—leaks, electrical problems, broken fixtures, and similar unit problems. Emergency situations that threaten safety should still start with a phone call to your property emergency contact if you have one, then log the issue so there is a written record.",
        ],
      },
      {
        heading: "Writing a helpful request",
        paragraphs: [
          "Describe what is wrong, where it is (room or area), when it started, and whether it is getting worse. Clear detail helps the caretaker and office respond faster.",
          "Add photos when the form allows it. Photos reduce back-and-forth and help the team prepare the right tools.",
        ],
      },
      {
        heading: "Following status",
        paragraphs: [
          "After you submit, you can open the issue to see progress notes your team shares. Status changes mean the office or caretaker has updated the work—not that you need to re-send the same request.",
          "Avoid opening duplicate issues for the same problem; reply or wait for updates on the existing ticket when possible.",
        ],
      },
    ],
    takeaways: [
      "Log issues in the portal so history is searchable later.",
      "Include location, timing, and photos when you can.",
      "One issue per problem reduces duplicates.",
      "Use emergency contacts first for immediate danger.",
    ],
    relatedGuideSlugs: [
      "tenant-portal-getting-started",
      "tenant-lease-documents-notices",
    ],
    relatedLinks: [
      {
        title: "Issues",
        href: "/dashboard/tenant/issues",
        description: "View or create maintenance requests.",
      },
    ],
    faq: [
      {
        question: "Can I message the caretaker directly in the app?",
        answer:
          "Workflows vary by property. Use the issue thread and official contacts your office provided rather than personal social apps for official requests.",
      },
    ],
  },
  {
    slug: "tenant-lease-documents-notices",
    category: "Tenant",
    privateInApp: true,
    title: "Lease, documents, and notices",
    summary:
      "Where to find lease information, shared documents, and notices from your property team.",
    readingMinutes: 6,
    publishedAt: "2026-07-10",
    keywords: ["tenant lease", "tenant notices"],
    sections: [
      {
        heading: "Lease information",
        paragraphs: [
          "Your lease section shows the key terms your property team has on file for your unit—such as rent amount and important dates—when they have published them to the portal.",
          "If something looks outdated, contact the office. Do not assume a chat message automatically updates the official lease record.",
        ],
      },
      {
        heading: "Signing or reviewing documents",
        paragraphs: [
          "Sometimes you may receive a link to review or sign a lease document. Use only links from EstateDesk or your known property team. Never enter your portal password on unknown websites.",
        ],
      },
      {
        heading: "Notices",
        paragraphs: [
          "Notices may include reminders, policy updates, or inspection schedules. Read them carefully and keep copies if the portal lets you download or print them.",
        ],
      },
    ],
    takeaways: [
      "Lease details in the portal reflect what your property team maintains.",
      "Only sign through official links from your team or EstateDesk.",
      "Check notices regularly so you do not miss inspections or deadlines.",
    ],
    relatedGuideSlugs: [
      "tenant-portal-getting-started",
      "tenant-paying-your-bills",
    ],
    relatedLinks: [
      {
        title: "Tenant home",
        href: "/dashboard/tenant",
        description: "Back to your dashboard.",
      },
    ],
    faq: [
      {
        question: "Can I download my receipt?",
        answer:
          "After a payment is confirmed, receipts or payment history entries are usually available from the payments area. If something is missing, ask the office to re-share it.",
      },
    ],
  },

  // ─── Caretaker ──────────────────────────────────────────────────────────
  {
    slug: "caretaker-workspace-getting-started",
    category: "Caretaker",
    privateInApp: true,
    title: "Getting started as a caretaker",
    summary:
      "How the caretaker workspace is scoped to your assigned units and which daily tasks you can complete in the field.",
    readingMinutes: 7,
    publishedAt: "2026-07-10",
    keywords: ["caretaker portal", "field staff help"],
    sections: [
      {
        heading: "Your scope",
        paragraphs: [
          "The caretaker workspace is limited to properties and units assigned to you. You should not see the full organization portfolio, billing configuration, or other staffs' private tools.",
          "If a unit is missing that you are responsible for on site, ask your office to update your assignments—do not borrow another staff login.",
        ],
      },
      {
        heading: "Typical daily work",
        paragraphs: [
          "Most days you will open issues assigned to you, submit meter readings for the period, capture inspection notes, and upload photos when needed.",
          "Work online when you have signal. Some field screens are designed to be usable on a phone browser; save progress carefully if your connection is unstable.",
        ],
      },
      {
        heading: "What you should not do",
        paragraphs: [
          "Do not attempt to change rent amounts, approve your own readings as final bills, or access tenant payment details beyond what a task screen shows. Those steps belong to the office.",
          "Do not share photos of tenant spaces outside official workflows.",
        ],
      },
    ],
    takeaways: [
      "You only see assigned units—by design.",
      "Focus on issues, readings, and inspections for those units.",
      "Never share logins or export tenant photos outside the app.",
      "Ask the office to fix assignment gaps.",
    ],
    relatedGuideSlugs: [
      "caretaker-submitting-meter-readings",
      "caretaker-issues-and-inspections-guide",
    ],
    relatedLinks: [
      {
        title: "Caretaker home",
        href: "/dashboard/caretaker",
        description: "Open your field workspace.",
      },
    ],
    faq: [
      {
        question: "Why can't I open another building?",
        answer:
          "Assignments control access. Your supervisor or office admin must add the building or unit to your caretaker scope.",
      },
    ],
  },
  {
    slug: "caretaker-submitting-meter-readings",
    category: "Caretaker",
    privateInApp: true,
    title: "Submitting water meter readings",
    summary:
      "How to capture a reading for an assigned unit, add a photo, and what happens after the office reviews it.",
    readingMinutes: 8,
    publishedAt: "2026-07-10",
    keywords: ["caretaker meter reading", "water reading field"],
    sections: [
      {
        heading: "Before you start",
        paragraphs: [
          "Confirm you are on the correct unit and meter. Wrong unit readings create disputes for tenants and extra work for the office.",
          "Note the previous reading if it is shown on screen, and read the meter carefully at eye level.",
        ],
      },
      {
        heading: "Submitting the reading",
        paragraphs: [
          "Open the water or meter flow for the unit, enter the current reading, add optional notes (for example a damaged dial), and attach a clear photo when the form allows it.",
          "Submit only when the numbers match the meter. If you make a mistake, contact the office promptly—do not invent a second reading to “fix” it without guidance.",
        ],
      },
      {
        heading: "After you submit",
        paragraphs: [
          "Submitted readings go to the office for review. You may see a pending or submitted status. Office staff approve or reject; tenants are billed only after the office issues the charge according to their process.",
          "You do not need to explain office billing math to tenants. Direct billing questions to the property office.",
        ],
      },
    ],
    takeaways: [
      "Double-check unit and meter before saving.",
      "Photos help the office when readings are disputed.",
      "Office review happens after you submit.",
      "Send tenants to the office for bill questions.",
    ],
    relatedGuideSlugs: [
      "caretaker-workspace-getting-started",
      "caretaker-issues-and-inspections-guide",
    ],
    relatedLinks: [
      {
        title: "Caretaker home",
        href: "/dashboard/caretaker",
        description: "Return to field tasks.",
      },
    ],
    faq: [
      {
        question: "The meter looks broken.",
        answer:
          "Capture a photo, note the problem in the reading notes or an issue ticket, and tell the office. Do not guess a number.",
      },
      {
        question: "Can I edit a reading after submit?",
        answer:
          "That depends on status and office policy. If the form no longer allows edits, contact the office instead of creating conflicting records.",
      },
    ],
  },
  {
    slug: "caretaker-issues-and-inspections-guide",
    category: "Caretaker",
    privateInApp: true,
    title: "Issues and inspections in the field",
    summary:
      "How to update maintenance issues, add evidence, and complete inspection notes for assigned units.",
    readingMinutes: 8,
    publishedAt: "2026-07-10",
    keywords: ["caretaker issues", "caretaker inspections"],
    sections: [
      {
        heading: "Working issues",
        paragraphs: [
          "Open assigned issues, read the tenant or office description, update status when work progresses, and add notes the office can search later.",
          "When work is complete, mark it according to the statuses available—do not leave finished jobs sitting in an open state.",
        ],
      },
      {
        heading: "Photos and evidence",
        paragraphs: [
          "Before-and-after photos reduce arguments about what was fixed. Only upload images related to the job, and avoid capturing unrelated personal belongings when possible.",
        ],
      },
      {
        heading: "Inspections",
        paragraphs: [
          "Inspection flows may ask for room-by-room notes or checklist items. Complete them carefully—these records can support move-in or move-out decisions later.",
          "If you cannot access a unit, record that fact and notify the office rather than skipping silently.",
        ],
      },
    ],
    takeaways: [
      "Update issue status so the office is not guessing.",
      "Photos belong to the official job record only.",
      "Finish inspection checklists accurately.",
      "Report access problems instead of skipping units.",
    ],
    relatedGuideSlugs: [
      "caretaker-workspace-getting-started",
      "caretaker-submitting-meter-readings",
    ],
    relatedLinks: [
      {
        title: "Caretaker home",
        href: "/dashboard/caretaker",
        description: "Open assigned work.",
      },
    ],
    faq: [
      {
        question: "A tenant is angry about a bill while I am on site.",
        answer:
          "Stay polite, do not promise billing changes, and ask them to contact the office or use the tenant portal. You should not adjust charges from the caretaker workspace.",
      },
    ],
  },

  // ─── Organization ───────────────────────────────────────────────────────
  {
    slug: "org-workspace-getting-started",
    category: "Organization",
    privateInApp: true,
    title: "Organization workspace overview",
    summary:
      "How office, manager, and accountant roles use the organization dashboard for portfolio, billing, and day-to-day operations.",
    readingMinutes: 9,
    publishedAt: "2026-07-10",
    keywords: ["org dashboard", "property office help"],
    sections: [
      {
        heading: "Who this workspace is for",
        paragraphs: [
          "The organization workspace is for property staff—admins, managers, office teams, and accountants—working inside one company account. It is separate from the tenant portal, caretaker field app, and EstateDesk platform control plane.",
          "What you can open depends on your role. Admins usually manage settings and staff; accountants focus on payments and reports; office roles handle daily tenant and issue work.",
        ],
      },
      {
        heading: "Core areas",
        paragraphs: [
          "Portfolio covers properties, buildings, and units. Occupancy covers tenants and leases. Billing covers charges, water approvals, and the payments queue. Operations covers issues, inspections, and move-outs. Settings cover organization preferences available to your role.",
        ],
      },
      {
        heading: "Good operating habits",
        paragraphs: [
          "Keep unit occupancy and lease data accurate before chasing balances. Review pending payments and water approvals on a schedule so tenants are not left waiting. Prefer in-app records over informal chat for anything that might be audited later.",
        ],
      },
      {
        heading: "What this help does not cover",
        paragraphs: [
          "These guides do not include EstateDesk platform engineering tools, hosting secrets, or other organizations' data. If you need product support beyond your workspace, contact EstateDesk support through official channels—not through tenant accounts.",
        ],
      },
    ],
    takeaways: [
      "Org workspace is for staff of one company only.",
      "Role permissions limit settings and money tools.",
      "Accurate leases and units make billing reliable.",
      "Keep audit-worthy work in the product, not only chat.",
    ],
    relatedGuideSlugs: [
      "org-verify-payments-guide",
      "org-approve-water-readings",
      "org-manage-tenants-and-leases",
      "org-staff-roles-overview",
    ],
    relatedLinks: [
      {
        title: "Organization home",
        href: "/dashboard/org",
        description: "Open the org dashboard.",
      },
    ],
    faq: [
      {
        question: "Why is a menu item missing?",
        answer:
          "Your role may not include that permission, or your subscription plan may not include the module. Ask an organization admin.",
      },
    ],
  },
  {
    slug: "org-verify-payments-guide",
    category: "Organization",
    privateInApp: true,
    title: "Reviewing and verifying tenant payments",
    summary:
      "How staff confirm manual payment proof, what instant payments do automatically, and how to avoid double-counting.",
    readingMinutes: 11,
    publishedAt: "2026-07-10",
    keywords: ["verify payment", "org payments queue"],
    sections: [
      {
        heading: "Two kinds of tenant payments",
        paragraphs: [
          "Instant gateway payments (for example M-Pesa phone prompts when enabled) are confirmed by the payment provider. When they succeed, balances usually update without a manual approve step.",
          "Manual payments are different: the tenant pastes a code or bank reference. Those stay pending until a staff member verifies them against real money received.",
        ],
      },
      {
        heading: "Using the payments queue",
        paragraphs: [
          "Open the organization payments area and filter for pending verification. Check amount, tenant, period, and reference carefully before approving.",
          "If the reference was already used or does not match bank/M-Pesa records, reject or leave pending and follow up—do not approve to “clear the list.”",
        ],
      },
      {
        heading: "Partial payments and combined bills",
        paragraphs: [
          "Tenants may pay part of a combined rent and water balance. After verification, the system applies amounts according to product rules (typically rent-related charges before water for the period). Review the resulting balances on the tenant record if something looks off.",
        ],
      },
      {
        heading: "Sensitive handling",
        paragraphs: [
          "Payment references and phone numbers are sensitive. Do not paste full confirmation SMS threads into public chats. Use the in-app record and limit access to staff who need to reconcile money.",
          "This guide does not document provider credentials, webhook configuration, or platform-level controls—those belong to technical operators only.",
        ],
      },
    ],
    takeaways: [
      "Instant payments auto-confirm; manual ones need staff review.",
      "Match amount, tenant, period, and reference before approve.",
      "Never approve a duplicate or unmatched reference.",
      "Keep payment proof inside staff systems, not public chat.",
    ],
    relatedGuideSlugs: [
      "org-workspace-getting-started",
      "org-approve-water-readings",
      "org-billing-period-guide",
    ],
    relatedLinks: [
      {
        title: "Payments",
        href: "/dashboard/org/payments",
        description: "Open the organization payments queue.",
      },
    ],
    faq: [
      {
        question: "A tenant says they paid via M-Pesa prompt but the bill is open.",
        answer:
          "Ask for the time and phone used. Check payment history for a successful entry. If nothing exists, they may not have completed the phone prompt—or the attempt failed. Do not invent a manual entry without a real reference.",
      },
      {
        question: "Can office staff change how money is allocated?",
        answer:
          "Follow your organization's policy and the tools available on the payment screens. If allocation tools are limited, contact an admin or EstateDesk support rather than editing records outside the app.",
      },
    ],
  },
  {
    slug: "org-approve-water-readings",
    category: "Organization",
    privateInApp: true,
    title: "Approving water meter readings",
    summary:
      "How office staff review caretaker submissions, approve or reject readings, and issue tenant water charges safely.",
    readingMinutes: 8,
    publishedAt: "2026-07-10",
    keywords: ["approve water reading", "water approvals"],
    sections: [
      {
        heading: "Queue review",
        paragraphs: [
          "Caretakers submit readings for their assigned units. Those submissions appear for office review before tenants should treat them as final payable charges.",
          "Compare current vs previous reading, unit identity, and any photo evidence. Large unexplained jumps deserve a quick call or site check before approval.",
        ],
      },
      {
        heading: "Approve vs reject",
        paragraphs: [
          "Approve when the reading is credible. Rejection should include a clear reason so the caretaker can correct the field work.",
          "After approval, the water charge becomes part of the tenant's billing for that period according to your workflow.",
        ],
      },
      {
        heading: "Disputes",
        paragraphs: [
          "If a tenant disputes a bill, open the reading history and photo evidence first. Resolve with facts rather than adjusting numbers informally outside the system.",
        ],
      },
    ],
    takeaways: [
      "Office approval sits between field reading and tenant bill.",
      "Use photos and history before approving outliers.",
      "Reject with reasons caretakers can act on.",
      "Keep dispute evidence in the product record.",
    ],
    relatedGuideSlugs: [
      "org-workspace-getting-started",
      "org-verify-payments-guide",
      "org-billing-period-guide",
    ],
    relatedLinks: [
      {
        title: "Organization home",
        href: "/dashboard/org",
        description: "Find water and billing tools from the dashboard.",
      },
    ],
    faq: [
      {
        question: "Can caretakers approve their own readings?",
        answer:
          "No. Field staff submit; office roles review. That separation protects tenants and ownership.",
      },
    ],
  },
  {
    slug: "org-manage-tenants-and-leases",
    category: "Organization",
    privateInApp: true,
    title: "Tenants, leases, and move-related records",
    summary:
      "How to keep tenant profiles, leases, and occupancy status accurate so billing and portal access stay correct.",
    readingMinutes: 9,
    publishedAt: "2026-07-10",
    keywords: ["manage tenants", "leases org"],
    sections: [
      {
        heading: "Create clean tenant records",
        paragraphs: [
          "Capture legal name, contacts, and unit assignment carefully. Mistyped phones cause failed payment prompts and missed notices.",
          "When inviting a tenant to the portal, use official invitation or credential flows—not password sharing over social apps.",
        ],
      },
      {
        heading: "Leases drive billing",
        paragraphs: [
          "Active lease terms (rent, due day, unit link) are the foundation for period charges. Update leases when rent changes; do not silently change only a spreadsheet.",
          "End or move-out processes should be completed so vacant units stop accruing tenant expectations incorrectly.",
        ],
      },
      {
        heading: "Privacy",
        paragraphs: [
          "Tenant identity documents and contacts are sensitive. Limit access to staff who need them and avoid downloading bulk personal data to unsecured devices.",
        ],
      },
    ],
    takeaways: [
      "Accurate contacts prevent payment and notice failures.",
      "Lease terms must match what you charge.",
      "Close occupancy cleanly at move-out.",
      "Treat tenant personal data as confidential.",
    ],
    relatedGuideSlugs: [
      "org-workspace-getting-started",
      "org-staff-roles-overview",
      "org-billing-period-guide",
    ],
    relatedLinks: [
      {
        title: "Organization home",
        href: "/dashboard/org",
        description: "Navigate to tenants and leases from the dashboard.",
      },
    ],
    faq: [
      {
        question: "A tenant left but still appears active.",
        answer:
          "Complete your move-out or lease end process so occupancy and portal expectations match reality. Ask an admin if you lack permission for that step.",
      },
    ],
  },
  {
    slug: "org-staff-roles-overview",
    category: "Organization",
    privateInApp: true,
    title: "Staff roles inside an organization",
    summary:
      "What admins, managers, office staff, accountants, caretakers, and landlords typically can do—and how to assign access safely.",
    readingMinutes: 8,
    publishedAt: "2026-07-10",
    keywords: ["staff roles", "org permissions"],
    sections: [
      {
        heading: "Role intent",
        paragraphs: [
          "Admin: organization settings, staff invites, and broad operational control. Manager: day-to-day portfolio leadership. Office: tenant service, issues, and routine records. Accountant: payments, reconciliation, and financial reports. Caretaker: field units only. Landlord: owner-facing views when enabled.",
          "Exact menus depend on your plan and configuration, but least-privilege is always safer than sharing one admin login across the whole team.",
        ],
      },
      {
        heading: "Inviting and removing staff",
        paragraphs: [
          "Invite people with the minimum role they need. When someone leaves the company, remove or suspend access promptly so they cannot open tenant data later.",
        ],
      },
      {
        heading: "What not to share",
        paragraphs: [
          "Do not share admin passwords, export files with full tenant lists on public drives, or grant caretaker accounts organization-admin rights “for convenience.”",
        ],
      },
    ],
    takeaways: [
      "Use separate logins and least-privilege roles.",
      "Remove access when staff leave.",
      "Caretakers stay unit-scoped; admins stay rare.",
      "Never share passwords across the team.",
    ],
    relatedGuideSlugs: [
      "org-workspace-getting-started",
      "org-manage-tenants-and-leases",
    ],
    relatedLinks: [
      {
        title: "Organization home",
        href: "/dashboard/org",
        description: "Open staff and settings tools available to your role.",
      },
    ],
    faq: [
      {
        question: "Can one person have two roles?",
        answer:
          "People generally work with one active organization role at a time. Ask an admin to adjust the role if responsibilities change.",
      },
    ],
  },
  {
    slug: "org-billing-period-guide",
    category: "Organization",
    privateInApp: true,
    title: "Period billing: rent, water, and month-end",
    summary:
      "How staff think about monthly periods, combined tenant bills, follow-up, and reports without exposing internal ledger engineering.",
    readingMinutes: 9,
    publishedAt: "2026-07-10",
    keywords: ["period billing", "month end rent"],
    sections: [
      {
        heading: "Think in periods",
        paragraphs: [
          "Most charges are organized by calendar month (period). Keep rent charges and approved water charges aligned to the correct period so tenant statements stay understandable.",
        ],
      },
      {
        heading: "Combined tenant view",
        paragraphs: [
          "Tenants often see rent and water together for the same month. That reduces confusion but means office staff should approve water and record payments promptly so the combined balance is trustworthy.",
        ],
      },
      {
        heading: "Month-end rhythm",
        paragraphs: [
          "A practical rhythm: confirm occupancy, ensure charges exist, approve outstanding readings, send reminders, verify pending payments, then run collection reports for ownership.",
          "Document waivers or special arrangements in the system or official notes so the next staff member is not guessing.",
        ],
      },
    ],
    takeaways: [
      "Periods keep rent and water comparable month to month.",
      "Combined bills need timely water approval and payment posting.",
      "Follow a repeatable month-end checklist.",
      "Record exceptions where the next teammate can find them.",
    ],
    relatedGuideSlugs: [
      "org-verify-payments-guide",
      "org-approve-water-readings",
      "org-workspace-getting-started",
    ],
    relatedLinks: [
      {
        title: "Organization home",
        href: "/dashboard/org",
        description: "Jump into billing tools from the dashboard.",
      },
    ],
    faq: [
      {
        question: "Should we still use spreadsheets?",
        answer:
          "Use EstateDesk as the system of record. Spreadsheets as temporary working notes are fine; do not let them replace verified payments and charges in the product.",
      },
    ],
  },

  // ─── Platform admin (not developer system docs) ─────────────────────────
  {
    slug: "platform-admin-handbook",
    category: "Platform",
    privatePlatform: true,
    privateInApp: true,
    title: "Platform administration handbook",
    summary:
      "Day-to-day EstateDesk platform admin work: organizations, users, onboarding, support access, messaging, and safe boundaries versus developer tools.",
    readingMinutes: 12,
    publishedAt: "2026-07-10",
    keywords: ["platform admin handbook", "platform operations"],
    sections: [
      {
        heading: "Admin mode purpose",
        paragraphs: [
          "Platform Administration is for EstateDesk operators who manage customer organizations, users, onboarding, billing visibility, and support—not for editing a single property company's day-to-day rent roll as if they were office staff (use Support Access for that).",
          "Developer mode and System Docs cover engineering depth. Prefer Admin mode for customer lifecycle work so nuclear and infrastructure tools stay out of routine paths.",
        ],
      },
      {
        heading: "Organizations and onboarding",
        paragraphs: [
          "Use Organizations to review status, search customers, and handle create/archive flows available to your role. Onboarding queues capture new company requests—process them with clear ownership and avoid leaving half-created orgs.",
          "Do not browse tenant personal data inside a customer org without a support reason and a timed support session.",
        ],
      },
      {
        heading: "Users and access",
        paragraphs: [
          "Platform user tools help with access recovery and role questions at the SaaS layer. Prefer forced password change and official channels over sending passwords in chat.",
          "Only super admins manage other super admins. Platform admins should not escalate their own privileges.",
        ],
      },
      {
        heading: "Support Access (timed)",
        paragraphs: [
          "When a customer needs hands-on help, open Support Access, choose the organization, capture a business reason, set a short duration, and enter. Work with the amber banner visible, then leave when finished.",
          "Support sessions are audited. Do not keep them open overnight “just in case,” and do not use them to explore unrelated customer data.",
        ],
      },
      {
        heading: "Messaging and broadcasts",
        paragraphs: [
          "Platform messages and broadcasts reach operators or organizations according to each tool. Write clearly, avoid sharing secrets in broadcast copy, and double-check audience scope before send.",
        ],
      },
      {
        heading: "What not to put in admin help or tickets",
        paragraphs: [
          "Never store API secrets, database URLs, or customer payment provider credentials in broadcast text, screenshots of env files, or public tickets. Use secure secret stores and developer-owned channels for infrastructure.",
          "Deep system internals (database pool tuning, service extraction, webhook secret rotation) live under Developer → System Docs, not in customer-facing communication.",
        ],
      },
    ],
    takeaways: [
      "Admin mode = customer lifecycle; Developer mode = engineering control.",
      "Support Access is timed, reasoned, and audited.",
      "Do not browse customer tenant data without a support session.",
      "Never paste infrastructure secrets into messages or help text.",
    ],
    relatedGuideSlugs: [
      "platform-admin-operations",
      "platform-website-control",
    ],
    relatedLinks: [
      {
        title: "Platform home",
        href: "/platform",
        description: "Administration dashboard.",
      },
      {
        title: "Support access",
        href: "/platform/support-access",
        description: "Start a timed support session.",
      },
      {
        title: "System docs (developer)",
        href: "/platform/developer/docs",
        description: "Deep engineering reference—platform operators only.",
      },
    ],
    faq: [
      {
        question: "When should I use System Docs instead of this handbook?",
        answer:
          "Use System Docs for architecture, payment settlement internals, database resilience, and integration failure modes. Use this handbook for day-to-day admin and support conduct.",
      },
      {
        question: "Can platform admins enable maintenance mode?",
        answer:
          "Website Control kill switches are super-admin tools. Platform admins should escalate to a super admin for global surface changes unless your runbook says otherwise.",
      },
    ],
  },
  {
    slug: "platform-support-playbook",
    category: "Platform",
    privatePlatform: true,
    privateInApp: true,
    title: "Customer support playbook for platform operators",
    summary:
      "How to handle common customer requests safely: access issues, billing confusion, payment disputes, and escalation—without leaking secrets.",
    readingMinutes: 10,
    publishedAt: "2026-07-10",
    keywords: ["platform support playbook", "customer support"],
    sections: [
      {
        heading: "Verify the requester",
        paragraphs: [
          "Before changing access or entering an organization, confirm the requester is authorized for that customer (known admin contact, ticket trail, or verified email domain process your team uses).",
          "Social-engineering risk is real: do not grant access solely because someone claims to be “the landlord’s cousin.”",
        ],
      },
      {
        heading: "Access and login problems",
        paragraphs: [
          "Prefer password reset and forced password change flows. Avoid collecting customer passwords. If an org needs a new staff user, guide their admin to invite from the org workspace when possible.",
        ],
      },
      {
        heading: "Payment and billing confusion",
        paragraphs: [
          "Distinguish SaaS subscription billing (EstateDesk plan) from tenant rent collection inside a customer org. For tenant payment disputes, use Support Access only when necessary, review payment status with the customer admin present when possible, and do not share one tenant’s payment references with another tenant.",
          "Do not paste provider credentials or raw webhook payloads into customer email.",
        ],
      },
      {
        heading: "Escalation",
        paragraphs: [
          "Escalate to super admin or engineering when global outages, webhook failures across many orgs, or data integrity issues appear. Capture organization id, timeframe, and user-visible symptoms—not secrets.",
        ],
      },
    ],
    takeaways: [
      "Verify identity before support actions.",
      "Never collect or share customer passwords.",
      "Separate SaaS billing from in-org rent collection.",
      "Escalate outages with symptoms, not secrets.",
    ],
    relatedGuideSlugs: [
      "platform-admin-handbook",
      "platform-admin-operations",
    ],
    relatedLinks: [
      {
        title: "Support access",
        href: "/platform/support-access",
        description: "Timed entry into a customer org.",
      },
      {
        title: "Platform help hub",
        href: "/platform/help",
        description: "All platform operator guides.",
      },
    ],
    faq: [
      {
        question: "A customer wants their database export emailed.",
        answer:
          "Use official data export / backup tools and secure transfer practices. Do not email raw database dumps to personal inboxes.",
      },
    ],
  },
] as const satisfies readonly GuideArticle[];
