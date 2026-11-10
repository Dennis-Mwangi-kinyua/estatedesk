import { z } from "zod";
export const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY", "INTERNSHIP"] as const;
export const workplaces = ["ON_SITE", "HYBRID", "REMOTE"] as const;
export const applicationStages = ["SUBMITTED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED", "WITHDRAWN"] as const;
export type ApplicationStage = typeof applicationStages[number];
export class RecruitmentError extends Error {}
export function check(value: unknown, message: string): asserts value { if (!value) throw new RecruitmentError(message); }
const optionalAmount = z.union([z.literal(""), z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, "Use a positive amount with at most two decimal places.")]);
export const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(`${v}T00:00:00Z`); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v; }, "Choose a valid closing date.");
export const jobSchema = z.object({
  title: z.string().trim().min(3).max(160), department: z.string().trim().max(100), location: z.string().trim().min(2).max(160),
  employmentType: z.enum(employmentTypes), workplace: z.enum(workplaces), description: z.string().trim().min(30).max(12000), requirements: z.string().trim().min(10).max(8000),
  salaryMin: optionalAmount, salaryMax: optionalAmount, currencyCode: z.string().regex(/^[A-Z]{3}$/), salaryPeriod: z.enum(["HOUR", "MONTH", "YEAR"]), closingDate: calendarDate,
}).superRefine((v, ctx) => {
  if (!!v.salaryMin !== !!v.salaryMax || (v.salaryMin && Number(v.salaryMax) < Number(v.salaryMin))) ctx.addIssue({ code: "custom", path: ["salaryMin"], message: "Provide both salary bounds, with maximum at least the minimum, or leave both blank." });
});
export const applicationSchema = z.object({ fullName: z.string().trim().min(2).max(120), email: z.string().trim().email().max(160).transform(v => v.toLowerCase()), phone: z.string().trim().min(6).max(40), coverLetter: z.string().trim().min(30).max(6000), portfolioUrl: z.union([z.literal(""), z.string().trim().url().max(500).refine(v => /^https?:\/\//i.test(v), "Use an HTTPS or HTTP portfolio link.")]), consent: z.literal("on", { error: "Please consent to sharing your application with this employer." }) });
const transitions: Record<ApplicationStage, readonly ApplicationStage[]> = {
  SUBMITTED: ["SCREENING", "SHORTLISTED", "INTERVIEW", "REJECTED", "WITHDRAWN"],
  SCREENING: ["SHORTLISTED", "INTERVIEW", "REJECTED", "WITHDRAWN"],
  SHORTLISTED: ["SCREENING", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"],
  INTERVIEW: ["SHORTLISTED", "OFFERED", "REJECTED", "WITHDRAWN"],
  OFFERED: ["INTERVIEW", "HIRED", "REJECTED", "WITHDRAWN"],
  HIRED: [], REJECTED: ["SCREENING"], WITHDRAWN: [],
};
export function allowedStages(status: string): readonly ApplicationStage[] { return transitions[status as ApplicationStage] ?? []; }
export function validateResume(bytes: Uint8Array) {
  check(bytes.length > 0 && bytes.length <= 1024 * 1024, "CV must be a PDF of 1MB or less.");
  check([37, 80, 68, 70, 45].every((value, index) => bytes[index] === value), "CV must be a genuine PDF document.");
  return bytes;
}
export const label = (s: string) => s.toLowerCase().replaceAll("_", " ").replace(/^./, c => c.toUpperCase());
