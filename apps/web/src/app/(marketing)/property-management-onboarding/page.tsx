import { SeoLandingPage, type SeoLandingPageContent } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

const content: SeoLandingPageContent = {
  "path": "/property-management-onboarding",
  "eyebrow": "Practical property operations",
  "title": "Move property records from spreadsheets into EstateDesk",
  "summary": "Set up your property workspace with a guided checklist and reviewed CSV imports for properties, units and tenants.",
  "intro": [
    "Moving from spreadsheets needs a clear order: create the organization, confirm access, prepare portfolio records and review what will be imported. EstateDesk gives property teams a setup checklist and CSV preview workflow to work through those steps.",
    "Illustrative example: a manager prepares one building and a small group of units first. They preview the CSV, correct the reported problems and confirm the records before moving on to tenant setup. Starting with a small batch makes it easier to check the source data; this is an example workflow, not a customer testimonial."
  ],
  "features": [
    {
      "title": "Follow a setup checklist",
      "body": "See the main setup tasks in one place and open the relevant workspace to complete the next step."
    },
    {
      "title": "Preview CSV records",
      "body": "Review the import preview and address validation errors before confirming the changes."
    },
    {
      "title": "Confirm access early",
      "body": "Invite the right people and review roles so staff can work within their organization permissions."
    }
  ],
  "howItWorks": [
    {
      "title": "Prepare a small batch",
      "body": "Use the supported CSV format and check identifiers, names and required fields against the source spreadsheet."
    },
    {
      "title": "Review the preview",
      "body": "Inspect the preview, resolve errors and confirm the intended records before applying the import."
    },
    {
      "title": "Check the workspace",
      "body": "Review the resulting properties, units and tenant records with your team before expanding to the rest of the portfolio."
    }
  ],
  "faq": [
    {
      "question": "Does previewing a CSV immediately create records?",
      "answer": "The preview is for reviewing the proposed import. Records are applied through the confirmation step, after validation."
    },
    {
      "question": "Should I import my entire portfolio at once?",
      "answer": "Start with a small, representative batch, review the results and correct your source data before importing the remaining records."
    },
    {
      "question": "Can I get help setting up?",
      "answer": "Request a demo to discuss the portfolio records you have, the supported import workflow and the setup steps your team needs."
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
  "serviceType": "Move property records from spreadsheets into EstateDesk"
};

export const metadata = publicPageMetadata({ title: content.title, description: content.summary, path: content.path });

export default function Page() { return <SeoLandingPage content={content} />; }
