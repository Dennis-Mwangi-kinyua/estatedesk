export const WATER_BILLS_WORKFLOW = [
  {
    step: "1",
    title: "Read meters",
    description: "Capture previous and current readings for occupied assigned units.",
  },
  {
    step: "2",
    title: "Submit to office",
    description: "Send readings for review before they move into billing.",
  },
  {
    step: "3",
    title: "Track tenant bills",
    description: "Follow approved readings through issued tenant water bills.",
  },
] as const;
