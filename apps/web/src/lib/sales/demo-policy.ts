/** Public demo requests never provision a workspace or start a subscription. */
export const DEMO_SOURCE = "DEMO_REQUEST";
export const TRIAL_DAYS = 14;
export const DEMO_DURATION = "30–45 minutes";

export function trialFollowUps(start: Date) {
  return [
    { day: 3, subject: "Trial check-in", body: "Contact the customer: help add their first property, tenant and lease, and resolve setup blockers." },
    { day: 7, subject: "Trial progress review", body: "Review the customer's experience, answer questions and confirm the right subscription plan." },
    { day: 12, subject: "Trial expiry reminder", body: "Contact the customer: their 14-day trial ends in two days. Explain pricing and help arrange subscription payment." },
    { day: 14, subject: "Trial conversion follow-up", body: "Confirm subscription payment or discuss next steps. The seven-day payment grace period is separate from the trial." },
  ].map(({ day, ...task }) => ({ ...task, dueAt: new Date(start.getTime() + day * 86_400_000) }));
}
