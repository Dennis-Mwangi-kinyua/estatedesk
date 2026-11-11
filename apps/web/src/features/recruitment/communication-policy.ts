export const applicationReference = (id: string) => `ED-${id.toUpperCase()}`;
export const stageMessageKinds: Record<string, string> = { SHORTLISTED: "SHORTLIST", INTERVIEW: "INTERVIEW", OFFERED: "OFFER", REJECTED: "REJECTION" };
export function candidateMessage(input: { id: string; fullName: string; title: string; employer: string; kind: string; interviewAt?: Date | null; interviewDetails?: string }) {
  const reference = applicationReference(input.id);
  const appointment = input.interviewAt ? new Intl.DateTimeFormat("en-KE", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(input.interviewAt) + " (Africa/Nairobi, UTC+03:00)" : "";
  const messages: Record<string, string> = {
    RECEIPT: "We have received your application. Our hiring team will review it and contact you about any next steps.",
    SHORTLIST: "Your application has been shortlisted. Our hiring team will contact you about the next steps.",
    INTERVIEW: `We would like to invite you to an interview on ${appointment}.\n${input.interviewDetails ?? ""}\nPlease reply to the hiring contact provided below to confirm your availability.`,
    INTERVIEW_REMINDER: `A reminder of your interview on ${appointment}.\n${input.interviewDetails ?? ""}`,
    OFFER: "We would like to discuss an offer for this role. Please review the offer details and next steps provided by our hiring team below.",
    REJECTION: "Thank you for your interest and the time you put into your application. We will not be proceeding with your application for this role.",
  };
  return { subject: `${input.employer}: ${input.kind === "RECEIPT" ? "Application received" : input.kind === "INTERVIEW_REMINDER" ? "Interview reminder" : "Application update"} — ${input.title}`.slice(0, 200), body: `Hello ${input.fullName},\n\n${messages[input.kind] ?? ""}\n\nRole: ${input.title}\nApplication reference: ${reference}\n\n${input.employer} hiring team` };
}
