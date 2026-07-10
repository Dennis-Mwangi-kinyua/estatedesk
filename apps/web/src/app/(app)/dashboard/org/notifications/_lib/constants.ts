export const OPERATIONS_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Review queues",
    description: "Clear move-out notices and water reading submissions before billing runs.",
  },
  {
    step: "02",
    title: "Monitor signals",
    description: "Track payment activity and communication delivery across the organization.",
  },
  {
    step: "03",
    title: "Act on alerts",
    description: "Send reminders, mark notifications read, and keep tenant workflows moving.",
  },
] as const;