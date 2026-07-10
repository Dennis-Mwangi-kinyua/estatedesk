import type { ContentDepthSections } from "@/lib/content-depth/types";
import {
  guideTopicLink,
  sharedEditorialDepth,
  sharedProblemsSolved,
  sharedTopicGuides,
  sharedWorkflowScenarios,
} from "@/lib/content-depth/site-topics";

export const landingDepthByPath: Record<string, ContentDepthSections> = {
  "/property-management-software-kenya": {
    scenarios: [
      sharedWorkflowScenarios[0],
      sharedWorkflowScenarios[1],
      {
        title: "Nairobi multi-building portfolio oversight",
        body: "A Nairobi property manager tracks tenants, rent, water bills, and caretaker issues across several buildings without maintaining separate files for each location.",
      },
      {
        title: "Agency onboarding for a new client portfolio",
        body: "An agency imports structure for properties and units, assigns staff roles, and begins rent and vacancy workflows with searchable records from day one.",
      },
    ],
    problems: [
      sharedProblemsSolved[0],
      sharedProblemsSolved[1],
      {
        problem: "Kenyan rental teams juggle M-Pesa receipts, paper records, and chat updates.",
        solution:
          "EstateDesk keeps payment records, balances, tenant notes, and follow-up visible in one Kenya-focused rental workspace.",
      },
      sharedProblemsSolved[3],
    ],
    guides: [
      guideTopicLink("kenya-rental-operations"),
      guideTopicLink("rent-tracking-workflow"),
      guideTopicLink("water-billing-workflow"),
      sharedTopicGuides[4],
    ],
    editorial: [
      sharedEditorialDepth[0],
      "Kenyan rental operations often combine apartments, bedsitters, shops, student housing, and mixed-use units. EstateDesk content explains how one system can still organize those different unit types with tenants, leases, rent, water billing, vacancies, caretakers, and inspections tied to the correct property record.",
    ],
  },
  "/property-management-software-dubai": {
    scenarios: [
      sharedWorkflowScenarios[5],
      {
        title: "Agency reporting to an overseas owner",
        body: "A UAE agency records tenant, maintenance, and rent activity online so the owner abroad can review progress without waiting for informal summaries.",
      },
      sharedWorkflowScenarios[2],
      {
        title: "Multi-region portfolio visibility",
        body: "A team managing rentals in Dubai and East Africa uses one operational model for tenants, leases, issues, vacancies, and reports across regions.",
      },
    ],
    problems: [
      {
        problem: "Remote owners depend on chat updates that are hard to verify later.",
        solution:
          "EstateDesk gives diaspora and UAE owners a structured online record of tenants, balances, maintenance, and team activity.",
      },
      sharedProblemsSolved[4],
      sharedProblemsSolved[5],
      {
        problem: "Agencies struggle to show accountability to property owners.",
        solution:
          "Issue history, inspections, rent records, and staff access create a clearer reporting base for client communication.",
      },
    ],
    guides: [
      guideTopicLink("diaspora-landlord-management"),
      guideTopicLink("kenya-rental-operations"),
      sharedTopicGuides[0],
      sharedTopicGuides[4],
    ],
    editorial: [
      "Dubai and UAE property pages need to speak to remote visibility, agency-managed portfolios, and international owners who still need trustworthy records. EstateDesk explains how web-based rental operations help those teams review tenants, maintenance, vacancies, and reports from anywhere.",
      sharedEditorialDepth[2],
    ],
  },
  "/landlord-software": {
    scenarios: [
      {
        title: "Small landlord first portfolio setup",
        body: "A landlord with one or two buildings creates units, adds tenants, records leases, and starts tracking rent without enterprise complexity.",
      },
      sharedWorkflowScenarios[0],
      sharedWorkflowScenarios[3],
      sharedWorkflowScenarios[2],
    ],
    problems: [
      {
        problem: "Small landlords outgrow memory-based tracking but fear complicated software.",
        solution:
          "EstateDesk starts with a Free plan and clear tenant, lease, rent, and vacancy records that scale as the portfolio grows.",
      },
      sharedProblemsSolved[0],
      sharedProblemsSolved[2],
      sharedProblemsSolved[5],
    ],
    guides: [
      guideTopicLink("rent-tracking-workflow"),
      guideTopicLink("vacancy-marketing-guide"),
      sharedTopicGuides[1],
      sharedTopicGuides[4],
    ],
    editorial: [
      "Landlord software content should speak directly to ownership decisions: who has paid, what is vacant, what repair is open, and what lease is ending soon. EstateDesk landlord pages emphasize those daily questions and the records needed to answer them confidently.",
      sharedEditorialDepth[1],
    ],
  },
  "/rent-tracking-software": {
    scenarios: [
      sharedWorkflowScenarios[0],
      {
        title: "Accountant payment verification before month-end report",
        body: "An accountant reviews payment entries, verification status, and tenant balances before sending management a rent collection summary.",
      },
      {
        title: "Partial payment and balance follow-up",
        body: "A tenant pays part of the monthly rent, the balance remains visible on the tenant record, and the office schedules the next follow-up from the same ledger context.",
      },
    ],
    problems: [
      sharedProblemsSolved[0],
      {
        problem: "Spreadsheets hide which tenant owes what once multiple buildings are involved.",
        solution:
          "Rent tracking in EstateDesk stays connected to tenants, units, leases, water bills, and reports for clearer portfolio visibility.",
      },
      {
        problem: "Payment disputes are hard to settle without a searchable payment history.",
        solution:
          "Payment records, balances, and tenant context remain reviewable in one system instead of scattered receipts.",
      },
      sharedProblemsSolved[5],
    ],
    guides: [
      guideTopicLink("rent-tracking-workflow"),
      guideTopicLink("move-out-review-checklist"),
      sharedTopicGuides[2],
      sharedTopicGuides[4],
    ],
    editorial: [
      "Rent tracking pages should explain the full follow-up cycle: charge creation, payment recording, balance visibility, reminders, verification, and reporting. EstateDesk content treats rent as part of the wider tenant and property record, not an isolated spreadsheet column.",
      sharedEditorialDepth[2],
    ],
  },
  "/water-billing-software": {
    scenarios: [
      sharedWorkflowScenarios[1],
      sharedWorkflowScenarios[4],
      {
        title: "Disputed water charge review",
        body: "When a tenant questions a bill, the office opens reading history, prior periods, and the related unit record instead of searching paper meter books.",
      },
    ],
    problems: [
      sharedProblemsSolved[1],
      {
        problem: "Caretakers and office staff use different tools for readings and billing.",
        solution:
          "EstateDesk connects reading workflows, approvals, tenant charges, and billing history in one rental operations system.",
      },
      sharedProblemsSolved[0],
      sharedProblemsSolved[4],
    ],
    guides: [
      guideTopicLink("water-billing-workflow"),
      guideTopicLink("caretaker-field-workflows"),
      sharedTopicGuides[3],
      sharedTopicGuides[4],
    ],
    editorial: [
      "Water billing content needs to explain readings, approvals, tenant charges, and move-out reconciliation in plain language. EstateDesk pages describe how water billing fits beside rent, inspections, and tenant history so the workflow is easier to audit.",
      sharedEditorialDepth[0],
    ],
  },
};

export function getLandingContentDepth(path: string): ContentDepthSections | undefined {
  return landingDepthByPath[path];
}