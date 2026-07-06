import type { ActionState, StepItem } from "./types";

export const initialCreateTenantActionState: ActionState = {
  status: "idle",
};

export const stepItems: StepItem[] = [
  {
    id: 1,
    title: "Tenant details",
    description: "Identity and contact info",
  },
  {
    id: 2,
    title: "Next of kin",
    description: "Emergency contact",
  },
  {
    id: 3,
    title: "Unit and lease",
    description: "Assign house and terms",
  },
  {
    id: 4,
    title: "Preview",
    description: "Review before save",
  },
];

export const TENANT_SETUP_GUIDANCE = [
  {
    title: "Preview before save",
    text: "Step 4 shows the tenant profile, next of kin, unit assignment, and account details before you commit.",
  },
  {
    title: "After saving",
    text: "The tenant profile, next of kin, and login account are created. Username and password are shown once.",
  },
  {
    title: "Unit assignment",
    text: "You can assign a vacant unit now or leave it blank and map the tenant later from the tenant profile.",
  },
] as const;

export const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export const stepPanelClassName =
  "rounded-2xl border border-border bg-muted/10 p-4 sm:p-5";

export const inputClassName =
  "h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60";

export const textareaClassName =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonPrimaryClassName =
  "inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonSecondaryClassName =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60";