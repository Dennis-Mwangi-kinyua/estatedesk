import { absoluteUrl, noIndexPageMetadata, publicPageMetadata } from "../../lib/seo";

export type CareerSearch = { q?: string; location?: string; employer?: string; page?: string };
export function careerSearch(input: CareerSearch) {
  return {
    q: input.q?.trim().slice(0, 100) ?? "",
    location: input.location?.trim().slice(0, 100) ?? "",
    employer: input.employer?.trim().slice(0, 100) ?? "",
    page: Math.max(1, Math.min(10000, Math.trunc(Number(input.page) || 1))),
  };
}
export function careerMetadata(input: CareerSearch) {
  const { q, location, employer, page } = careerSearch(input);
  const filtered = Boolean(q || location || employer);
  const path = page > 1 && !filtered ? `/careers?page=${page}` : "/careers";
  return (filtered ? noIndexPageMetadata : publicPageMetadata)({
    title: `Careers and job opportunities${page > 1 ? ` — Page ${page}` : ""}`,
    description: "Explore jobs posted by EstateDesk and property organizations. See the hiring employer and apply directly online.",
    path,
  });
}

type Job = {
  id: string; slug: string; title: string; description: string; requirements: string;
  location: string; employmentType: string; workplace: string;
  publishedAt: Date | null; closesAt: Date;
  salaryMin: { toString(): string } | null; salaryMax: { toString(): string } | null;
  salaryPeriod: string; currencyCode: string; org: { name: string; slug: string } | null;
};
const escapeHtml = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/** Reflect the published content; never invent a country, address or remote eligibility. */
export function jobStructuredData(job: Job) {
  const employer = job.org?.name ?? "EstateDesk";
  const description = `<p>${escapeHtml(job.description).replaceAll("\n", "<br>")}</p><h2>Requirements</h2><p>${escapeHtml(job.requirements).replaceAll("\n", "<br>")}</p>`;
  return {
    "@context": "https://schema.org", "@type": "JobPosting",
    title: job.title, description, url: absoluteUrl(`/careers/${job.slug}`),
    identifier: { "@type": "PropertyValue", name: employer, value: job.id },
    datePosted: job.publishedAt?.toISOString(), validThrough: job.closesAt.toISOString(),
    employmentType: job.employmentType === "CONTRACT" ? "CONTRACTOR" : job.employmentType === "INTERNSHIP" ? "INTERN" : job.employmentType,
    hiringOrganization: { "@type": "Organization", name: employer },
    jobLocation: { "@type": "Place", name: job.location, address: { "@type": "PostalAddress", addressLocality: job.location } },
    ...(job.workplace === "REMOTE" ? { jobLocationType: "TELECOMMUTE" } : {}),
    ...(job.salaryMin !== null && job.salaryMax !== null ? { baseSalary: {
      "@type": "MonetaryAmount", currency: job.currencyCode,
      value: { "@type": "QuantitativeValue", minValue: Number(job.salaryMin.toString()), maxValue: Number(job.salaryMax.toString()), unitText: job.salaryPeriod },
    } } : {}),
  };
}
