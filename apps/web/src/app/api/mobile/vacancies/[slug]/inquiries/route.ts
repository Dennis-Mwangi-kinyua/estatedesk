import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { sendVacancyInquiryAction } from "@/app/vacancies/[location]/actions";
import { isNativeRequest, mobileJson } from "@/lib/mobile/api";
import { readBoundedJson } from "@/lib/security/bounded-json";
import { nativeVacancyInquirySchema } from "@estatedesk/contracts/mobile";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!isNativeRequest(request)) return mobileJson({ error: "Native client required." }, 403);
  const { slug } = await context.params;
  if (!slug || slug.length > 200) return mobileJson({ error: "This vacancy is no longer available." }, 404);
  const parsed = nativeVacancyInquirySchema.safeParse(await readBoundedJson(request, 12000).catch(() => null));
  if (!parsed.success) return mobileJson({ error: "Check your name, phone, email and enquiry message." }, 400);
  const form = new FormData();
  for (const [key, value] of Object.entries(parsed.data)) form.set(key, value);
  form.set("website", "");
  try {
    await sendVacancyInquiryAction(slug, form);
    return mobileJson({ error: "The enquiry could not be confirmed." }, 400);
  } catch (error) {
    if (!isRedirectError(error)) throw error;
    const url = new URL(getURLFromRedirectError(error) ?? "/", "https://estatedesk.invalid");
    if (url.origin !== "https://estatedesk.invalid" || !url.pathname.startsWith("/vacancies/")) throw error;
    if (url.searchParams.get("sent") === "1") return mobileJson({ ok: true, message: "Your enquiry has been sent to the property team." });
    return mobileJson({ error: url.searchParams.get("error") ?? "This vacancy may no longer be available." }, 400);
  }
}
