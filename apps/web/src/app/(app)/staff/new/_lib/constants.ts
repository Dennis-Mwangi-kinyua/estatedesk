export const STAFF_SETUP_WORKFLOW = [
  {
    step: "01",
    title: "Setup",
    description:
      "Choose the staff role. Caretakers also pick a property or apartment/block assignment up front.",
  },
  {
    step: "02",
    title: "Profile",
    description:
      "Capture identity, contacts, and HR details such as job title, salary, ID, and emergency contact.",
  },
  {
    step: "03",
    title: "Login",
    description:
      "Set the username and password the staff member will use to sign in.",
  },
] as const;

export const STAFF_SETUP_GUIDANCE = [
  {
    title: "Role first",
    text: "Pick the operational role before entering profile details. Caretakers map to a property or apartment/block in the first step.",
  },
  {
    title: "Complete every field",
    text: "All profile and login fields are required before staff can be created.",
  },
  {
    title: "Caretaker mapping",
    text: "Caretakers can be mapped to a whole property or to a specific apartment/block. Multiple caretakers can share the same apartment.",
  },
  {
    title: "Login credentials",
    text: "The staff member gets a verified email login and secure password during creation.",
  },
] as const;