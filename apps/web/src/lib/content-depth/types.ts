export type WorkflowScenario = {
  title: string;
  body: string;
};

export type ProblemSolution = {
  problem: string;
  solution: string;
};

export type TopicGuideLink = {
  title: string;
  href: string;
  description: string;
};

export type ContentDepthSections = {
  scenariosTitle?: string;
  scenarios?: readonly WorkflowScenario[];
  problemsTitle?: string;
  problems?: readonly ProblemSolution[];
  guidesTitle?: string;
  guides?: readonly TopicGuideLink[];
  editorialTitle?: string;
  editorial?: readonly string[];
};