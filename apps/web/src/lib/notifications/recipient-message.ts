export type RecipientMessageDraft = { fullName: string; email?: string | null; phone?: string | null; subject: string; message: string };
export type CreatedAccountLogin = { fullName: string; username: string; setupUrl: string; email?: string | null; phone?: string | null; role: string; loginUrl: string };

export function recipientEmailHref(draft: RecipientMessageDraft) {
  const recipient = encodeURIComponent(draft.email?.trim() ?? "").replace(/%40/g, "@");
  return `mailto:${recipient}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.message)}`;
}
export function recipientWhatsAppHref(draft: RecipientMessageDraft) {
  let digits = (draft.phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(draft.message)}`;
}
export function buildAllocationDraft(input: { fullName: string; email?: string | null; phone?: string | null; property: string; unit: string; startDate: string; monthlyRent: string; deposit?: string; dueDay?: number; workspace?: string; loginUrl: string }): RecipientMessageDraft {
  return { fullName: input.fullName, email: input.email, phone: input.phone, subject: "Your EstateDesk unit allocation confirmation", message: [
    `Hello ${input.fullName},`, "", "We are pleased to confirm your house/unit allocation.", "",
    input.workspace ? `Workspace: ${input.workspace}` : null, `Property: ${input.property}`, `House / unit: ${input.unit}`, `Lease starts: ${input.startDate}`, `Monthly rent: ${input.monthlyRent}`, input.deposit ? `Deposit: ${input.deposit}` : null, input.dueDay ? `Rent due day: ${input.dueDay} of each month` : null,
    "", `View your tenancy and billing details: ${input.loginUrl}`, "Please contact your property management team if you need help with your allocation or move-in arrangements.", "", "Kind regards,", "The EstateDesk Team",
  ].filter(line => line !== null).join("\n") };
}
export function buildAccountStatusDraft(input: { fullName: string; email?: string | null; phone?: string | null; status: string; reason?: string; loginUrl: string }): RecipientMessageDraft {
  const status = input.status.toLowerCase();
  return { fullName: input.fullName, email: input.email, phone: input.phone, subject: input.status === "ACTIVE" ? "Your EstateDesk account access has been restored" : `Important update: your EstateDesk account is ${status}`, message: [
    `Hello ${input.fullName},`, "", input.status === "ACTIVE" ? "Your EstateDesk account access has been restored. You can now sign in using your existing credentials." : `Your EstateDesk account has been ${status}. Access to your account is currently unavailable.`,
    input.reason ? `Reason: ${input.reason}` : null, "", `Account sign-in: ${input.loginUrl}`, "Please contact the administrator who manages your account for clarification or assistance.", "", "Kind regards,", "The EstateDesk Team",
  ].filter(line => line !== null).join("\n") };
}
