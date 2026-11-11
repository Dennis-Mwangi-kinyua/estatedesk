import { SeoLandingPage, type SeoLandingPageContent } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

const content: SeoLandingPageContent = {
  "path": "/rent-collection-software",
  "eyebrow": "Practical property operations",
  "title": "Rent collection software for property teams in Kenya",
  "summary": "Turn overdue rent into a clear daily follow-up queue. Review balances, assign ownership, track promises to pay and check payment evidence in EstateDesk.",
  "intro": [
    "A rent ledger shows what is outstanding. A collections workflow helps your team decide what to do next. EstateDesk brings overdue balances, follow-up tasks and payment review into a daily workspace for authorized property staff.",
    "Illustrative example: a property manager starts the morning with three overdue tenants. One has submitted payment evidence, one has promised to pay on Friday and one needs a first reminder. The team reviews each case before choosing its next action; this is an example, not a customer result."
  ],
  "features": [
    {
      "title": "Review overdue balances",
      "body": "Start with outstanding rent and identify the accounts that need attention, using the recorded charges and payments in your organization."
    },
    {
      "title": "Assign the next step",
      "body": "Keep responsibility clear with follow-up tasks, due dates and recorded promises to pay."
    },
    {
      "title": "Review before reminding",
      "body": "Check payment evidence and recorded balances before sending an approved reminder. A collection task does not verify a payment."
    }
  ],
  "howItWorks": [
    {
      "title": "Check the account",
      "body": "Review the tenant balance and supporting payment records before contacting the tenant."
    },
    {
      "title": "Record the conversation",
      "body": "Assign a follow-up and record the agreed date or promise to pay so colleagues can continue the work."
    },
    {
      "title": "Review and close the loop",
      "body": "Verify payment through the authorized payment workflow, then review the account and any remaining follow-ups."
    }
  ],
  "faq": [
    {
      "question": "Does a reminder automatically confirm payment?",
      "answer": "No. A reminder is a communication. Submitted payment evidence still needs the appropriate review before it is treated as a verified payment."
    },
    {
      "question": "Can the team use collections on a phone?",
      "answer": "The collections workspace is designed for mobile use, with account summaries and follow-up actions that authorized staff can access on their phones."
    },
    {
      "question": "Can I see collections before choosing a plan?",
      "answer": "Request a demo and ask the team to walk through overdue balances, task assignment and payment review using your portfolio requirements."
    }
  ],
  "audienceTitle": "Who this workflow helps",
  "audiences": [
    {
      "title": "Property managers",
      "body": "Coordinate the team around shared records and a clear next action."
    },
    {
      "title": "Landlords and growing teams",
      "body": "Keep portfolio records organized as you move beyond individual spreadsheets."
    }
  ],
  "featureTitle": "A structured workflow for your team",
  "benefitsTitle": "What your team gains",
  "benefits": [
    "A shared place to review the work.",
    "Clear responsibility for the next step.",
    "Records that colleagues can check before taking action."
  ],
  "howItWorksTitle": "How to get started",
  "ctaTitle": "See the workflow with your team",
  "ctaBody": "Request a guided demo and discuss your portfolio, records and daily operations.",
  "serviceType": "Rent collection software for property teams in Kenya"
};

export const metadata = publicPageMetadata({ title: content.title, description: content.summary, path: content.path });

export default function Page() { return <SeoLandingPage content={content} />; }
