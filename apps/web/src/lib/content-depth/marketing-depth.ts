import type { ContentDepthSections } from "@/lib/content-depth/types";
import {
  guideTopicLink,
  sharedEditorialDepth,
  sharedProblemsSolved,
  sharedTopicGuides,
  sharedWorkflowScenarios,
} from "@/lib/content-depth/site-topics";

export const vacancyContentDepth: ContentDepthSections = {
  scenariosTitle: "How vacancy discovery fits rental operations",
  scenarios: [
    sharedWorkflowScenarios[3],
    {
      title: "Tenant search by location and unit type",
      body: "A tenant browses public vacancy pages by town, category, and rent range instead of relying on scattered social posts or word-of-mouth alone.",
    },
    {
      title: "Office enquiry follow-up with property context",
      body: "When a vacancy enquiry arrives, the managing office already knows the property, unit, availability, and rent details behind the listing.",
    },
  ],
  problems: [
    sharedProblemsSolved[3],
    {
      problem: "Vacancy marketing is disconnected from lease and tenant records.",
      solution:
        "EstateDesk keeps vacancy publishing tied to live property records so availability and enquiries stay aligned with operations.",
    },
    sharedProblemsSolved[5],
  ],
  guidesTitle: "Related guides and discovery paths",
  guides: [
    guideTopicLink("vacancy-marketing-guide"),
    guideTopicLink("kenya-rental-operations"),
    sharedTopicGuides[6],
    sharedTopicGuides[0],
  ],
  editorialTitle: "Why vacancy pages need operational depth",
  editorial: [
    "Vacancy discovery works best when tenants can compare location, rent, unit type, and property context in one place. EstateDesk public vacancy pages are designed for that structured discovery path.",
    sharedEditorialDepth[2],
  ],
};

export const trustContentDepth: ContentDepthSections = {
  guidesTitle: "Explore EstateDesk product and workflow guides",
  guides: [
    sharedTopicGuides[4],
    guideTopicLink("kenya-rental-operations"),
    guideTopicLink("tenant-issue-tracking"),
    sharedTopicGuides[1],
  ],
  editorialTitle: "How trust content connects to rental operations",
  editorial: [
    "Security, privacy, and data handling matter because property teams store tenant records, billing history, staff access, and operational activity in one system. EstateDesk trust pages explain those responsibilities alongside the product workflows they protect.",
    "Readers evaluating EstateDesk for production rollout can pair these trust pages with workflow guides on rent tracking, water billing, caretaker coordination, and move-out review to understand both governance and day-to-day operations.",
  ],
};