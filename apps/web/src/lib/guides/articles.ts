import type { GuideArticle } from "@/lib/guides/types";

export const guideArticles = [
  {
    slug: "rent-tracking-workflow",
    category: "Billing",
    title: "Rent tracking workflow for landlords and property managers",
    summary:
      "A practical guide to moving from spreadsheets to structured rent charges, payment records, unpaid tenant follow-up, and month-end reporting in EstateDesk.",
    readingMinutes: 9,
    publishedAt: "2026-05-12",
    keywords: [
      "rent tracking software",
      "unpaid rent follow-up",
      "tenant ledger software",
      "rent management system Kenya",
    ],
    sections: [
      {
        heading: "Why rent tracking breaks down in spreadsheets",
        paragraphs: [
          "Most rental teams start with a simple rent sheet. It works until the portfolio grows, partial payments appear, water bills sit beside rent in separate files, and month-end follow-up depends on one person remembering every balance.",
          "Spreadsheets also make disputes harder. When a tenant says they paid, the office may need receipts, bank messages, and prior balances spread across notebooks and chat threads. A structured rent ledger keeps charges, payments, and balances tied to the tenant and unit record.",
        ],
      },
      {
        heading: "How EstateDesk structures rent charges and balances",
        paragraphs: [
          "EstateDesk connects rent to the tenant, unit, lease, and property context. Charges stay visible beside occupancy history, so managers can review who owes what without rebuilding a workbook for every building.",
          "Payment records, verification status, and balance visibility live in the same workspace. That makes partial payments, late follow-up, and accountant review easier because the ledger is searchable instead of scattered.",
        ],
      },
      {
        heading: "Month-end rent follow-up in practice",
        paragraphs: [
          "A typical month-end workflow starts with filtering unpaid tenants, reviewing balances beside lease and water records, sending reminders, and recording payments as they arrive. Managers can verify entries before reports go out.",
          "Accountants benefit from the same record set. Instead of reconciling separate files, they review payment entries, verification status, and tenant balances before sending a rent collection summary to ownership or agency leadership.",
        ],
      },
      {
        heading: "What to set up before rolling out rent tracking",
        paragraphs: [
          "Start with clean tenant and lease records, then confirm unit occupancy before creating recurring rent expectations. Teams that skip that step often chase balances on the wrong unit or outdated lease terms.",
          "Decide who records payments, who verifies them, and who sends reminders. Clear roles prevent duplicate entries and make month-end reporting more trustworthy for landlords and remote owners.",
        ],
      },
    ],
    takeaways: [
      "Rent tracking works best when charges, payments, and balances stay tied to tenant and unit records.",
      "Partial payments and disputes are easier to settle with searchable payment history.",
      "Month-end follow-up improves when unpaid tenants, water bills, and lease context are reviewed together.",
      "Define payment recording and verification roles before scaling across multiple buildings.",
    ],
    relatedGuideSlugs: [
      "water-billing-workflow",
      "kenya-rental-operations",
      "move-out-review-checklist",
    ],
    relatedLinks: [
      {
        title: "Rent tracking software",
        href: "/rent-tracking-software",
        description: "Public overview of EstateDesk rent tracking, balances, and reporting workflows.",
      },
      {
        title: "Pricing",
        href: "/pricing",
        description: "Compare Free, Pro, Plus, and Custom plans for billing rollout.",
      },
    ],
    faq: [
      {
        question: "Can EstateDesk track partial rent payments?",
        answer:
          "Yes. Partial payments remain visible on the tenant record with an updated balance, so the office can schedule the next follow-up from the same ledger context.",
      },
      {
        question: "Does rent tracking include water billing context?",
        answer:
          "Yes. Rent balances can be reviewed beside water charges and tenant history, which helps during month-end follow-up and move-out review.",
      },
      {
        question: "Which plan includes rent tracking?",
        answer:
          "Rent tracking, balances, payment verification, and related billing workflows are included from the Pro plan upward.",
      },
    ],
  },
  {
    slug: "water-billing-workflow",
    category: "Billing",
    title: "Water billing workflow from meter reading to tenant charge",
    summary:
      "How caretaker readings, office approval, tenant water bills, billing history, and move-out reconciliation fit together in rental operations.",
    readingMinutes: 8,
    publishedAt: "2026-05-18",
    keywords: [
      "water billing software Kenya",
      "tenant water bills",
      "meter reading billing software",
      "rental water billing",
    ],
    sections: [
      {
        heading: "Why water billing often lives outside rent records",
        paragraphs: [
          "Many rental teams calculate water in a separate notebook or spreadsheet because readings happen in the field while billing happens in the office. That split creates audit problems when tenants question a charge or when move-out review needs prior periods.",
          "Without shared history, caretakers and office staff may use different numbers, and landlords cannot easily verify how a reading became a tenant bill.",
        ],
      },
      {
        heading: "Reading capture through tenant billing",
        paragraphs: [
          "EstateDesk connects caretaker meter readings, office review, tenant charges, and billing history to the unit and tenant record. A reading captured in the field can be reviewed before it becomes a payable bill.",
          "Tenants see updated balances in the same workflow that already holds rent and occupancy history, which reduces confusion when both charges appear on follow-up.",
        ],
      },
      {
        heading: "Handling disputed water charges",
        paragraphs: [
          "When a tenant questions a bill, the office should open reading history, prior periods, and the related unit record instead of searching paper meter books. Clear period-by-period history makes disputes faster to resolve.",
          "Dispute handling also improves staff handovers. New office staff can review the same searchable record instead of relying on informal explanations from the previous team.",
        ],
      },
      {
        heading: "Move-out and water reconciliation",
        paragraphs: [
          "Move-out review is smoother when rent balance, water charges, inspection notes, and issue history are reviewed together. Water billing should not be a separate conversation at the end of a tenancy.",
          "Teams that connect water history to move-out decisions reduce clearance delays and give landlords a stronger basis for deposit or balance discussions.",
        ],
      },
    ],
    takeaways: [
      "Water billing improves when readings, approvals, charges, and history stay on one unit record.",
      "Disputed bills are easier to audit with period-by-period reading history.",
      "Caretaker and office workflows should use the same operational record set.",
      "Move-out review should include water charges beside rent and inspection context.",
    ],
    relatedGuideSlugs: [
      "rent-tracking-workflow",
      "caretaker-field-workflows",
      "move-out-review-checklist",
    ],
    relatedLinks: [
      {
        title: "Water billing software",
        href: "/water-billing-software",
        description: "Search landing page for rental water billing workflows in EstateDesk.",
      },
      {
        title: "Services",
        href: "/services",
        description: "Feature overview for billing, inspections, maintenance, and reporting.",
      },
    ],
    faq: [
      {
        question: "Can caretakers record meter readings in the field?",
        answer:
          "Yes. Caretakers can capture readings as part of field workflows, and the office can review them before tenant charges are issued.",
      },
      {
        question: "Can tenants see water balances online?",
        answer:
          "Tenants can review billing context in the tenant workflow alongside rent and occupancy records, depending on team setup and plan.",
      },
      {
        question: "How does water billing help during move-out?",
        answer:
          "Billing history stays tied to the tenant and unit, so teams can review outstanding water charges beside rent and inspection records during clearance.",
      },
    ],
  },
  {
    slug: "caretaker-field-workflows",
    category: "Operations",
    title: "Caretaker field workflows for rental properties",
    summary:
      "How caretakers use EstateDesk for meter readings, maintenance issues, inspections, and office coordination without relying on chat screenshots alone.",
    readingMinutes: 8,
    publishedAt: "2026-05-24",
    keywords: [
      "caretaker management software",
      "property maintenance workflow",
      "caretaker issue reporting",
      "field operations property management",
    ],
    sections: [
      {
        heading: "What caretakers need in the field",
        paragraphs: [
          "Caretakers usually need three things on site: a way to report issues, a way to record readings or inspection findings, and a way to confirm what the office already knows about a unit or tenant.",
          "When those actions live only in WhatsApp, context disappears. Managers cannot easily search prior repairs, verify who reported an issue, or review whether a reading was approved.",
        ],
      },
      {
        heading: "Issue reporting with visible status history",
        paragraphs: [
          "EstateDesk issue workflows let caretakers log maintenance requests, update status, and keep office teams informed with searchable history. That reduces duplicate reports and makes handovers easier.",
          "Office staff can assign issues, review descriptions, and track progress without rebuilding a thread from chat exports.",
        ],
      },
      {
        heading: "Connecting field work to billing and inspections",
        paragraphs: [
          "Caretaker readings can feed water billing review. Inspection notes can support move-out decisions. When field work stays in the same system as tenant and unit records, the office spends less time reconciling separate tools.",
          "This connection matters most in multi-building portfolios where one caretaker covers several properties and the office needs a single operational view.",
        ],
      },
      {
        heading: "Role-aware access for caretaker teams",
        paragraphs: [
          "Caretakers should see the properties and workflows assigned to them without opening unrelated portfolio data. Role-aware access keeps field staff focused and reduces accidental changes to billing or lease records.",
          "Clear permissions also help agencies explain accountability to landlords, because caretaker activity stays tied to the operational record set.",
        ],
      },
    ],
    takeaways: [
      "Caretakers need searchable issue, reading, and inspection workflows—not chat-only updates.",
      "Field activity should connect to billing and office review in one system.",
      "Status history helps managers verify repairs without informal summaries.",
      "Role-aware access keeps caretakers focused on assigned properties and tasks.",
    ],
    relatedGuideSlugs: [
      "tenant-issue-tracking",
      "water-billing-workflow",
      "kenya-rental-operations",
    ],
    relatedLinks: [
      {
        title: "Property management software Kenya",
        href: "/property-management-software-kenya",
        description: "Regional overview of tenants, caretakers, billing, and reporting.",
      },
      {
        title: "FAQ",
        href: "/faq",
        description: "Answers on caretaker access, maintenance workflows, and pricing.",
      },
    ],
    faq: [
      {
        question: "Can caretakers create maintenance issues on mobile?",
        answer:
          "Yes. EstateDesk is web-based and works on phones and tablets, so caretakers can report issues from common mobile browsers in the field.",
      },
      {
        question: "Can the office assign issues to a caretaker?",
        answer:
          "Yes. Office teams can assign issues and track status changes with history that managers and landlords can review later.",
      },
      {
        question: "Which plan supports caretaker-heavy workflows?",
        answer:
          "Caretaker assignments, inspections, and deeper operational workflows are most relevant to the Plus plan and larger team rollouts.",
      },
    ],
  },
  {
    slug: "tenant-issue-tracking",
    category: "Maintenance",
    title: "Tenant issue tracking from report to closure",
    summary:
      "How tenants, caretakers, and office teams keep maintenance requests visible with assignments, status updates, and searchable issue history.",
    readingMinutes: 7,
    publishedAt: "2026-06-01",
    keywords: [
      "tenant maintenance software",
      "property issue tracking",
      "maintenance request workflow",
      "rental repair tracking",
    ],
    sections: [
      {
        heading: "Why maintenance requests disappear in chat",
        paragraphs: [
          "Tenants often report problems through phone calls or messaging apps. The request may get handled, but the record disappears into screenshots and voice notes that are hard to search later.",
          "That becomes costly when the same issue reappears, when a landlord asks for proof of repair, or when a move-out inspection references prior maintenance.",
        ],
      },
      {
        heading: "A clearer issue lifecycle",
        paragraphs: [
          "EstateDesk supports a visible issue lifecycle: report, assign, update status, document resolution, and review history. Tenants can submit requests, caretakers can update progress, and office teams can coordinate follow-up from one record.",
          "Searchable issue history helps managers answer ownership questions without reconstructing chat threads.",
        ],
      },
      {
        heading: "Assignments and accountability",
        paragraphs: [
          "Assignments matter in agencies and multi-building portfolios. When an issue is linked to a caretaker or staff member, everyone can see who owns the next step.",
          "Accountability also improves tenant trust. Tenants are more likely to use a structured reporting channel when status updates stay visible instead of disappearing after the first reply.",
        ],
      },
      {
        heading: "Issue history during inspections and move-out",
        paragraphs: [
          "Prior maintenance history helps during move-out review and recurring property inspections. Teams can see whether a reported leak was resolved, when work happened, and who handled it.",
          "That context supports better clearance decisions and reduces repeated disputes about unresolved repairs.",
        ],
      },
    ],
    takeaways: [
      "Maintenance requests need status history, not just initial acknowledgement.",
      "Assignments make responsibility clear across tenants, caretakers, and office staff.",
      "Searchable issue records help landlords verify repairs and prior work.",
      "Issue history supports inspections, move-out review, and tenant trust.",
    ],
    relatedGuideSlugs: [
      "caretaker-field-workflows",
      "move-out-review-checklist",
      "vacancy-marketing-guide",
    ],
    relatedLinks: [
      {
        title: "Services",
        href: "/services",
        description: "Overview of maintenance, inspections, tenants, and staff workflows.",
      },
      {
        title: "Landlord software",
        href: "/landlord-software",
        description: "How landlords organize tenants, repairs, vacancies, and reporting.",
      },
    ],
    faq: [
      {
        question: "Can tenants submit maintenance requests online?",
        answer:
          "Yes. Tenants can report issues through the tenant workflow so requests stay tied to the correct unit and tenancy record.",
      },
      {
        question: "Can caretakers update issue status from the field?",
        answer:
          "Yes. Caretakers can create and update issues so office teams and managers can track progress without chat-only follow-up.",
      },
      {
        question: "Do resolved issues stay searchable?",
        answer:
          "Yes. Issue history remains reviewable for managers, landlords, and office staff depending on access permissions.",
      },
    ],
  },
  {
    slug: "vacancy-marketing-guide",
    category: "Marketing",
    title: "Vacancy marketing and tenant discovery for rental units",
    summary:
      "How property teams publish vacant units, help tenants discover homes by location, and handle enquiries with clearer property context.",
    readingMinutes: 7,
    publishedAt: "2026-06-08",
    keywords: [
      "vacant houses Kenya",
      "rental vacancy marketing",
      "property listing software",
      "houses for rent Kenya",
    ],
    sections: [
      {
        heading: "Why informal vacancy posts underperform",
        paragraphs: [
          "Many vacant units are announced through calls, social posts, and agent messages. That can work for one unit, but it is hard to search later and difficult for tenants comparing locations, rent, and unit types.",
          "Structured vacancy pages give prospective tenants a clearer discovery path and give managers a more consistent marketing surface.",
        ],
      },
      {
        heading: "Publishing available units with context",
        paragraphs: [
          "EstateDesk public vacancy pages expose available units with location, rent, property details, and enquiry paths. Tenants can browse by area and unit type instead of chasing fragmented posts.",
          "Managers keep vacancy publishing connected to the operational property record, which reduces duplicate listings and outdated availability.",
        ],
      },
      {
        heading: "Location and category discovery",
        paragraphs: [
          "Search intent often starts with geography and unit type: apartments, bedsitters, shops, offices, or mixed-use spaces. Public discovery pages help tenants find relevant listings faster.",
          "For property teams, location-based discovery also creates a more durable marketing asset than one-off social announcements.",
        ],
      },
      {
        heading: "Handling enquiries with better context",
        paragraphs: [
          "Enquiries are easier to handle when the managing office already knows the property, unit, rent, and availability status behind the listing. That reduces back-and-forth for both tenants and staff.",
          "Vacancy marketing works best when it is tied to the same system that later manages lease, rent, and move-in records.",
        ],
      },
    ],
    takeaways: [
      "Structured vacancy pages outperform scattered social and phone-only announcements.",
      "Location and unit-type discovery helps tenants compare options faster.",
      "Vacancy publishing should stay connected to live property records.",
      "Better listing context reduces enquiry back-and-forth for office teams.",
    ],
    relatedGuideSlugs: [
      "kenya-rental-operations",
      "tenant-issue-tracking",
      "diaspora-landlord-management",
    ],
    relatedLinks: [
      {
        title: "Vacancies",
        href: "/vacancies",
        description: "Browse public vacancy listings by location and unit type.",
      },
      {
        title: "Property management markets",
        href: "/property-management-markets",
        description: "Index of EstateDesk pages by market and workflow intent.",
      },
    ],
    faq: [
      {
        question: "Can landlords publish vacant units publicly?",
        answer:
          "Yes. EstateDesk supports public vacancy pages so available units can be discovered online with location and property context.",
      },
      {
        question: "What unit types can appear on vacancy pages?",
        answer:
          "Vacancy discovery can cover apartments, bedsitters, shops, offices, and other rental spaces depending on what the organization publishes.",
      },
      {
        question: "Are vacancy pages intended for search discovery?",
        answer:
          "Yes. Public vacancy and location pages are part of EstateDesk public discovery and sitemap strategy.",
      },
    ],
  },
  {
    slug: "diaspora-landlord-management",
    category: "Remote management",
    title: "Diaspora and remote landlord property management",
    summary:
      "How overseas owners and remote landlords review tenants, balances, maintenance, vacancies, and team activity without relying on informal summaries.",
    readingMinutes: 8,
    publishedAt: "2026-06-14",
    keywords: [
      "diaspora landlord software",
      "remote property management",
      "property management software Dubai",
      "overseas landlord rent tracking",
    ],
    sections: [
      {
        heading: "The visibility problem for remote owners",
        paragraphs: [
          "Diaspora landlords and overseas owners often depend on chat updates from a local agent, caretaker, or family member. The property may be managed, but the owner cannot easily verify tenants, balances, repairs, or vacancy status later.",
          "Informal summaries also create tension during disputes. Without searchable records, it is hard to confirm what was collected, what remains outstanding, or whether maintenance was completed.",
        ],
      },
      {
        heading: "What remote owners need online",
        paragraphs: [
          "Remote ownership works better with online visibility into occupancy, rent records, water bills, open issues, inspections, vacancies, and recent activity. EstateDesk gives owners and agencies a shared operational record set for those reviews.",
          "The goal is not to replace the local team. It is to give the owner a trustworthy online view while the local team continues daily operations.",
        ],
      },
      {
        heading: "Agency accountability and reporting",
        paragraphs: [
          "Agencies managing property for overseas clients need more than end-of-month messages. Issue history, inspections, rent records, and staff access create a clearer reporting base for client communication.",
          "That structure helps agencies retain trust and reduces repeated requests for custom summaries.",
        ],
      },
      {
        heading: "Multi-region portfolio oversight",
        paragraphs: [
          "Some teams manage rentals in Kenya, East Africa, Dubai, or other regions at the same time. A consistent operational model for tenants, leases, issues, vacancies, and reports makes cross-region oversight easier.",
          "Remote landlord workflows benefit when terminology and record structure stay consistent even when local teams differ.",
        ],
      },
    ],
    takeaways: [
      "Remote owners need searchable records, not only chat summaries.",
      "Agencies can improve trust with issue, rent, and inspection history online.",
      "Shared operational records reduce repeated custom reporting requests.",
      "Consistent workflows help teams managing properties across regions.",
    ],
    relatedGuideSlugs: [
      "kenya-rental-operations",
      "rent-tracking-workflow",
      "vacancy-marketing-guide",
    ],
    relatedLinks: [
      {
        title: "Property management software Dubai",
        href: "/property-management-software-dubai",
        description: "Public page for Dubai, UAE, diaspora, and remote property teams.",
      },
      {
        title: "Contact",
        href: "/contact",
        description: "Talk to EstateDesk about rollout for remote or agency-managed portfolios.",
      },
    ],
    faq: [
      {
        question: "Can diaspora landlords review rent and balances online?",
        answer:
          "Yes. EstateDesk gives authorized users an online view of tenants, balances, payments, and related operational records.",
      },
      {
        question: "Is EstateDesk only for Kenya?",
        answer:
          "No. EstateDesk is web-based and also relevant to remote owners, agencies, and teams working in Dubai, UAE, East Africa, and other rental markets.",
      },
      {
        question: "Can agencies report to overseas owners from one system?",
        answer:
          "Yes. Agencies can use shared records for tenants, maintenance, inspections, rent activity, and vacancies instead of rebuilding reports from separate files.",
      },
    ],
  },
  {
    slug: "move-out-review-checklist",
    category: "Operations",
    title: "Move-out review checklist for rent, water, and inspections",
    summary:
      "A practical move-out review framework that combines rent balance, water charges, inspection notes, and issue history before clearance decisions.",
    readingMinutes: 7,
    publishedAt: "2026-06-20",
    keywords: [
      "tenant move-out process",
      "rental inspection checklist",
      "move-out water billing",
      "lease clearance workflow",
    ],
    sections: [
      {
        heading: "Why move-out decisions get delayed",
        paragraphs: [
          "Move-out delays often happen because rent, water, repairs, and inspection findings live in different places. The office may know the rent balance, but water history is in a notebook and repair context is buried in chat.",
          "When teams cannot review everything together, clearance conversations stretch and tenants lose confidence in the process.",
        ],
      },
      {
        heading: "What to review before clearance",
        paragraphs: [
          "A strong move-out review checks four areas together: rent balance, water charges, inspection findings, and open or recently resolved maintenance issues. Each item should link back to the tenant and unit record.",
          "EstateDesk keeps those records in one searchable workspace so the office does not need to assemble a manual clearance pack for every move-out.",
        ],
      },
      {
        heading: "Inspections and issue history",
        paragraphs: [
          "Inspection notes should reference prior maintenance where relevant. If a tenant reported a leak earlier, the move-out inspection should be reviewed beside that issue history.",
          "This reduces repeated arguments about whether a problem was pre-existing, unresolved, or introduced late in the tenancy.",
        ],
      },
      {
        heading: "Closing the tenancy with auditable records",
        paragraphs: [
          "Clearance works best when the final decision is based on searchable records rather than memory. Teams can document the outcome, confirm balances, and keep the move-out trail available for future reference.",
          "That audit trail also helps agencies and landlords answer questions from ownership or incoming property managers.",
        ],
      },
    ],
    takeaways: [
      "Move-out review should combine rent, water, inspections, and issue history.",
      "Delays often come from scattered records rather than complex policy.",
      "Prior maintenance history matters during final inspections.",
      "Auditable clearance records help agencies and remote owners verify outcomes.",
    ],
    relatedGuideSlugs: [
      "water-billing-workflow",
      "tenant-issue-tracking",
      "rent-tracking-workflow",
    ],
    relatedLinks: [
      {
        title: "Services",
        href: "/services",
        description: "Inspections, tenant history, billing, and operational reporting.",
      },
      {
        title: "Pricing",
        href: "/pricing",
        description: "See which plans include inspections and tenant history workflows.",
      },
    ],
    faq: [
      {
        question: "Can EstateDesk support move-out notices?",
        answer:
          "Yes. Move-out notice workflows are part of deeper operational plans and help teams prepare review before clearance.",
      },
      {
        question: "Can inspections be tied to a tenant record?",
        answer:
          "Yes. Inspection history can be reviewed beside tenant, unit, and issue records during move-out.",
      },
      {
        question: "Why include water billing in move-out review?",
        answer:
          "Water balances often remain outstanding at the end of a tenancy, so reviewing billing history beside rent prevents last-minute disputes.",
      },
    ],
  },
  {
    slug: "kenya-rental-operations",
    category: "Kenya",
    title: "Kenya rental operations from tenant onboarding to reporting",
    summary:
      "How Kenyan landlords, agencies, and caretakers organize tenants, leases, rent, water billing, vacancies, maintenance, and reporting in one workspace.",
    readingMinutes: 10,
    publishedAt: "2026-06-28",
    keywords: [
      "property management software Kenya",
      "Kenya landlord software",
      "rental operations Kenya",
      "property manager software Nairobi",
    ],
    sections: [
      {
        heading: "How Kenyan rental teams work day to day",
        paragraphs: [
          "Kenyan rental operations often combine apartments, bedsitters, shops, student housing, and mixed-use units. Managers juggle M-Pesa receipts, paper leases, caretaker updates, water readings, and vacancy calls across multiple buildings.",
          "The challenge is not only recording data. It is keeping tenant, lease, billing, maintenance, and vacancy context connected as the portfolio grows.",
        ],
      },
      {
        heading: "Core records every team should digitize first",
        paragraphs: [
          "The highest-impact starting point is usually tenant profiles, unit occupancy, lease terms, and rent expectations. Once those records are structured, water billing, issues, inspections, and vacancy publishing become much easier to layer on.",
          "Teams that jump straight to reporting without fixing foundational records often recreate spreadsheet chaos inside a new tool.",
        ],
      },
      {
        heading: "Kenya-specific workflows that matter",
        paragraphs: [
          "Rent follow-up, caretaker meter readings, public vacancy discovery, and staff handovers are especially important in Kenyan portfolios. EstateDesk content and workflows focus on those daily operational needs rather than generic feature lists.",
          "Nairobi multi-building oversight is a common scenario: one manager needs tenants, rent, water bills, and caretaker issues across several locations without maintaining separate files for each property.",
        ],
      },
      {
        heading: "Scaling from one landlord to agency operations",
        paragraphs: [
          "A small landlord may begin with one or two buildings, while an agency may onboard an entire client portfolio with staff roles from day one. The same system should support both paths with clearer permissions and searchable history.",
          "As teams scale, reporting, exports, audit visibility, and role-aware access become more important than basic record keeping alone.",
        ],
      },
    ],
    takeaways: [
      "Kenyan rental operations need connected tenant, billing, maintenance, and vacancy records.",
      "Start with tenants, occupancy, and leases before advanced reporting.",
      "Caretaker readings, rent follow-up, and public vacancies are core daily workflows.",
      "The same operational model should scale from small landlords to agencies.",
    ],
    relatedGuideSlugs: [
      "rent-tracking-workflow",
      "caretaker-field-workflows",
      "vacancy-marketing-guide",
    ],
    relatedLinks: [
      {
        title: "Property management software Kenya",
        href: "/property-management-software-kenya",
        description: "Primary Kenya search landing page for EstateDesk.",
      },
      {
        title: "Property management markets",
        href: "/property-management-markets",
        description: "Browse EstateDesk public pages by market and workflow.",
      },
    ],
    faq: [
      {
        question: "Is EstateDesk designed for Kenyan rental workflows?",
        answer:
          "Yes. EstateDesk is built around Kenyan rental operations including rent tracking, water billing, caretakers, vacancies, maintenance, and staff access.",
      },
      {
        question: "Can one system handle mixed unit types?",
        answer:
          "Yes. EstateDesk supports apartments, bedsitters, shops, offices, and mixed-use portfolios with tenant and billing records tied to the correct unit.",
      },
      {
        question: "Where should a Kenyan team start?",
        answer:
          "Most teams should start with tenant and lease records, then add rent tracking, water billing, issues, and vacancy publishing as daily operations mature.",
      },
    ],
  },
  {
    slug: "org-api-integration-guide",
    category: "Integrations",
    title: "Organization API keys and vacant-unit listings",
    summary:
      "How organization admins create API keys, authenticate requests, and publish vacant units to external apps using the public vacant-houses endpoint.",
    readingMinutes: 7,
    publishedAt: "2026-07-04",
    keywords: [
      "property management API",
      "vacancy API Kenya",
      "rental listings API",
      "EstateDesk API keys",
    ],
    sections: [
      {
        heading: "When to use organization API keys",
        paragraphs: [
          "Organization API keys let approved integrations read public vacancy data without signing into the dashboard. Typical uses include website vacancy widgets, partner listing portals, and internal tools that need a machine-readable unit feed.",
          "Keys are scoped to one organization and should be rotated when staff change or an integration is retired. Only organization admins should create and revoke credentials.",
        ],
      },
      {
        heading: "Creating and securing a key",
        paragraphs: [
          "Open Organization Settings, choose API Keys, name the integration, optionally set an expiry date, and create the key. Copy the secret immediately because it is shown only once at creation.",
          "Store keys in your integration secret manager—not in chat threads or shared documents. Revoke keys that are no longer needed instead of leaving dormant credentials active.",
        ],
      },
      {
        heading: "Calling the vacant-houses endpoint",
        paragraphs: [
          "Authenticated integrations call GET /api/public/vacant-houses with Authorization: Bearer <organization-api-key>. The key must be active, unexpired, and include vacant_units:read in its public listings permission set.",
          "Successful responses return up to 200 vacant units with pricing, location, property context, and image references. Rate limiting is 60 requests per minute per key or client IP; 429 responses include Retry-After.",
        ],
      },
      {
        heading: "Operational checks before go-live",
        paragraphs: [
          "Confirm vacancies are published for the units you expect, then test the endpoint from staging or a controlled client before pointing a public website at production.",
          "Monitor last-used timestamps in settings to verify the integration is calling the API as expected. Pair API usage with your vacancy marketing workflow so pricing and availability stay accurate.",
        ],
      },
    ],
    takeaways: [
      "API keys are organization-scoped and should be managed by admins only.",
      "Use Bearer authentication on GET /api/public/vacant-houses for vacancy feeds.",
      "Rotate and revoke keys when integrations change.",
      "Test permissions, rate limits, and published vacancies before go-live.",
    ],
    relatedGuideSlugs: [
      "vacancy-marketing-guide",
      "kenya-rental-operations",
      "rent-tracking-workflow",
    ],
    relatedLinks: [
      {
        title: "Vacancy marketing guide",
        href: "/guides/vacancy-marketing-guide",
        description: "Publish and promote vacant units before wiring an API feed.",
      },
      {
        title: "Public vacancies",
        href: "/vacancies",
        description: "See how published units appear on the public vacancy index.",
      },
    ],
    faq: [
      {
        question: "Which role can create organization API keys?",
        answer:
          "Organization admins create and revoke API keys from Organization Settings. Other staff roles do not manage integration credentials.",
      },
      {
        question: "What happens when a key is revoked?",
        answer:
          "Revoked keys immediately fail authentication with 401 responses. Update the integration with a new active key before deactivating the old one to avoid downtime.",
      },
      {
        question: "Does the API expose tenant or payment data?",
        answer:
          "No. The public vacant-houses endpoint returns published vacancy fields only. Tenant, payment, and lease records stay inside authenticated app workflows.",
      },
    ],
  },
  {
    slug: "platform-website-control",
    category: "Platform",
    title: "Website control center for platform operators",
    summary:
      "How super admins use kill switches, incident banners, nuclear session tools, and timed org support sessions without breaking audit trails.",
    readingMinutes: 7,
    publishedAt: "2026-07-09",
    keywords: [
      "platform control plane",
      "maintenance mode",
      "incident mode",
      "support session",
    ],
    sections: [
      {
        heading: "Admin mode vs Developer mode",
        paragraphs: [
          "EstateDesk platform operators work in one shell with two modes. Administration covers organizations, users, billing, onboarding, and support. Developer mode focuses on health, APIs, jobs, flags, rate limits, data, backups, and website control.",
          "Switch modes from the sidebar toggle or Alt+Shift+A / Alt+Shift+D. The shell remembers your last path in each mode.",
        ],
      },
      {
        heading: "Kill switches and incident banners",
        paragraphs: [
          "Website Control can enable maintenance mode (blocks tenant and org workspaces), disable public signup, public APIs, webhooks, and cron, and surface a public incident banner without fully locking the product.",
          "Prefer incident mode for communications-only events. Prefer maintenance mode when dashboards must not accept work.",
        ],
      },
      {
        heading: "Timed support sessions",
        paragraphs: [
          "From Support Access or Website Control, enter an organization as ADMIN with a reason and 1–8 hour duration. A banner in the org workspace shows remaining time, extend, and leave controls.",
          "Leaving support clears the timed cookie and returns your session to the platform shell. All enter, extend, and leave events are audit-logged.",
        ],
      },
      {
        heading: "Nuclear tools and confirmation phrases",
        paragraphs: [
          "Revoking all sessions, API keys, clearing rate limits, purging failed notifications, and forcing features across every organization require explicit confirmation phrases. These tools are super-admin only.",
          "After host-level backup or restore drills, record checkpoints on the Backups page so compliance evidence lives next to operational status.",
        ],
      },
    ],
    takeaways: [
      "Use Developer mode for engineering ops and Administration for customer operations.",
      "Incident mode communicates; maintenance mode blocks.",
      "Support sessions are timed, reason-captured, and leaveable.",
      "Nuclear actions need typed confirmation and produce audit + security alerts.",
    ],
    relatedGuideSlugs: ["org-api-integration-guide", "kenya-rental-operations"],
    relatedLinks: [
      {
        title: "Website control",
        href: "/platform/control",
        description: "Super-admin kill switches and nuclear ops.",
      },
      {
        title: "Support access",
        href: "/platform/support-access",
        description: "Timed organization support entry.",
      },
    ],
    faq: [
      {
        question: "Who can open Website Control?",
        answer: "Only SUPER_ADMIN. Platform admins can use Developer health tools and Support Access without nuclear credentials tools.",
      },
      {
        question: "Do global feature overrides rewrite every org?",
        answer: "Global overrides win over org settings at read time. Force-all-orgs also rewrites OrganizationSettings.features when confirmed.",
      },
    ],
  },
  {
    slug: "platform-admin-operations",
    category: "Platform",
    title: "Platform administration operations guide",
    summary:
      "Day-to-day administration of organizations, onboarding, billing views, messaging, and support access inside the EstateDesk platform shell.",
    readingMinutes: 6,
    publishedAt: "2026-07-09",
    keywords: [
      "platform admin",
      "organization onboarding",
      "support access",
      "billing oversight",
    ],
    sections: [
      {
        heading: "Core administration loop",
        paragraphs: [
          "Start from the platform dashboard for onboarding alerts and portfolio metrics. Use Organizations for create, archive, and status changes; Users and Admins for access; Onboarding for new company requests.",
          "Billing and subscriptions pages provide portfolio visibility. Plan overrides for emergencies live under Developer Website Control for super admins.",
        ],
      },
      {
        heading: "Supporting a customer safely",
        paragraphs: [
          "Open Support Access, pick the organization, capture a reason, choose a duration, and enter as support. Work inside the org shell with the amber banner visible, then leave support when finished.",
          "Do not share temporary passwords over unsecured channels. Prefer force password change from platform user tools when needed.",
        ],
      },
      {
        heading: "Messages, broadcasts, and marketing",
        paragraphs: [
          "Platform messages and broadcasts reach operators and orgs according to each tool's scope. Marketing tracks marketers and referral attribution for growth operations.",
          "Audit Logs and Security remain dual-mode so both admins and developers can investigate access events without switching context awkwardly.",
        ],
      },
    ],
    takeaways: [
      "Admin mode owns customer lifecycle; Developer mode owns engineering control.",
      "Support Access is the safe path into a live org workspace.",
      "Security and audit tools are available in both modes.",
    ],
    relatedGuideSlugs: ["platform-website-control"],
    relatedLinks: [
      {
        title: "Platform dashboard",
        href: "/platform",
        description: "Administration home.",
      },
      {
        title: "Support access",
        href: "/platform/support-access",
        description: "Timed support entry.",
      },
    ],
    faq: [
      {
        question: "Can platform admins create super admins?",
        answer: "No. Only an existing super admin can create another super admin.",
      },
    ],
  }

] satisfies readonly GuideArticle[];
