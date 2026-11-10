"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveMarketerReferral } from "@/lib/marketing/referrals";
import { logServerError } from "@/lib/errors/server-error-log";
import { sendVerificationEmail } from "@/lib/notifications/email";
import { setUserSession } from "@/lib/auth/session";
import {
  createFreeWorkspace,
  hashWorkspacePassword,
  isWorkspacePhone,
} from "@/lib/organizations/create-free-workspace";

import { DEMO_SOURCE } from "@/lib/sales/demo-policy";

const onboardingRequestSchema = z.object({
  intent: z.enum(["access", "demo"]).default("access"),
  accountType: z.enum(["PROPERTY_MANAGER", "LANDLORD"]),
  fullName: z.string().trim().min(2, "Enter your full name (at least 2 characters).").max(120),
  companyName: z.string().trim().min(2, "Enter an agency or portfolio name (at least 2 characters).").max(160),
  workEmail: z.string().trim().email("Enter a valid email address.").max(160).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(40).optional(),
  managedPropertyType: z.string().trim().min(2).max(80),
  message: z.string().trim().max(1200).optional(),
  referralCode: z.string().trim().max(40).optional(),
  plan: z.enum(["PRO", "PLUS", "ENTERPRISE"]).optional(),
});

const freeWorkspaceSchema = onboardingRequestSchema.omit({ plan: true }).extend({
  password: z.string().min(12, "Use at least 12 characters.").max(72, "Use 72 characters or fewer."),
  confirmPassword: z.string().max(72),
  acceptTerms: z.literal("yes", { message: "Agree to the terms to create a workspace." }),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Enter the same password in both fields.",
}).refine((value) => !value.phone || isWorkspacePhone(value.phone), {
  path: ["phone"],
  message: "Use international format, for example +254700000000.",
}).refine((value) => Buffer.byteLength(value.password, "utf8") <= 72, {
  path: ["password"],
  message: "Use 72 characters or fewer.",
});

function getClientIp(headerStore: Awaited<ReturnType<typeof headers>>) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headerStore.get("x-real-ip") ?? "unknown";
}

export type OnboardingRequestState = { error?: string; fieldErrors?: Record<string, string[] | undefined> };

export async function createOnboardingRequestAction(_previous: OnboardingRequestState, formData: FormData): Promise<OnboardingRequestState> {
  const headerStore = await headers();
  const ipAddress = getClientIp(headerStore);
  const website = String(formData.get("website") ?? "").trim();

  if (website) {
    redirect("/register?request=sent#request-access");
  }

  const { getPlatformControl } = await import("@/lib/platform/control");
  const control = await getPlatformControl();
  if (control.publicSignupDisabled || control.maintenanceMode) {
    return { error: "New access requests are temporarily paused. Please try again later." };
  }

  const parsed = onboardingRequestSchema.safeParse({
    intent: formData.get("intent") || "access",
    accountType: formData.get("accountType"),
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    workEmail: formData.get("workEmail"),
    phone: formData.get("phone") || undefined,
    managedPropertyType: formData.get("managedPropertyType"),
    message: formData.get("message") || undefined,
    referralCode: formData.get("referralCode") || undefined,
    plan: formData.get("plan") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please check the highlighted details below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const limiter = await checkRateLimit({
    key: `onboarding:${ipAddress}:${parsed.data.workEmail}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (!limiter.allowed) {
    return { error: "You have submitted several requests recently. Please try again in an hour." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const attribution = await resolveMarketerReferral(
        tx,
        parsed.data.referralCode ?? "",
      );

      await tx.onboardingRequest.create({
        data: {
          source: parsed.data.intent === "demo" ? DEMO_SOURCE : "REGISTER_PAGE",
          targetPlan: parsed.data.plan ?? "PRO",
          fullName: parsed.data.fullName,
          companyName: parsed.data.companyName,
          workEmail: parsed.data.workEmail,
          phone: parsed.data.phone,
          managedPropertyType: parsed.data.managedPropertyType,
          message: `Account type: ${parsed.data.accountType === "LANDLORD" ? "Landlord" : "Property management agency"}\nPlan: ${parsed.data.plan ?? "PRO"}\n${parsed.data.message ?? ""}`,
          marketerId: attribution.marketerId,
          referralCode: attribution.referralCode,
          commissionRate: attribution.commissionRate,
          ipAddress,
          userAgent: headerStore.get("user-agent"),
        },
      });
    });
  } catch {
    return { error: "We could not save your request. Your details are still here; please try again." };
  }

  revalidatePath("/platform/demos");
  revalidatePath("/platform/crm");
  revalidatePath("/platform/onboarding");
  revalidatePath("/platform/messages");
  revalidatePath("/platform/broadcasts");
  redirect(parsed.data.intent === "demo" ? "/register?intent=demo&request=demo-sent#request-access" : "/register?request=sent#request-access");
}

const FREE_WORKSPACE_ERRORS: Record<string, OnboardingRequestState> = {
  WORKSPACE_NAME: { error: "A workspace with this name already exists. Choose a different agency or portfolio name.", fieldErrors: { companyName: ["Choose a different name."] } },
  WORKSPACE_EMAIL: { error: "An account with this email already exists. Sign in, or use a different email.", fieldErrors: { workEmail: ["This email is already registered."] } },
  WORKSPACE_PHONE: { error: "An account with this phone number already exists. Leave the phone blank or use a different number.", fieldErrors: { phone: ["This phone number is already registered."] } },
  WORKSPACE_SLUG: { error: "Use letters or numbers in the workspace name.", fieldErrors: { companyName: ["Use a name containing letters or numbers."] } },
};

export async function registerAction(previous: OnboardingRequestState, formData: FormData): Promise<OnboardingRequestState> {
  const plan = String(formData.get("plan") ?? "FREE").toUpperCase();
  if (formData.get("intent") === "demo" || plan !== "FREE") return createOnboardingRequestAction(previous, formData);

  const headerStore = await headers();
  const ipAddress = getClientIp(headerStore);
  if (String(formData.get("website") ?? "").trim()) redirect("/register?request=sent#request-access");

  const { getPlatformControl } = await import("@/lib/platform/control");
  const control = await getPlatformControl();
  if (control.publicSignupDisabled || control.maintenanceMode) {
    return { error: "New workspaces are temporarily paused. Please try again later." };
  }

  const parsed = freeWorkspaceSchema.safeParse({
    accountType: formData.get("accountType"),
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    workEmail: formData.get("workEmail"),
    phone: formData.get("phone") || undefined,
    managedPropertyType: formData.get("managedPropertyType"),
    message: formData.get("message") || undefined,
    referralCode: formData.get("referralCode") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms"),
  });
  if (!parsed.success) {
    return { error: "Please check the highlighted details below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const limiter = await checkRateLimit({
    key: `free-workspace:${ipAddress}:${parsed.data.workEmail}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!limiter.allowed) {
    return { error: "You have submitted several requests recently. Please try again in an hour." };
  }

  let created: Awaited<ReturnType<typeof createFreeWorkspace>>;
  try {
    created = await createFreeWorkspace({
      accountType: parsed.data.accountType,
      fullName: parsed.data.fullName,
      companyName: parsed.data.companyName,
      workEmail: parsed.data.workEmail,
      phone: parsed.data.phone,
      managedPropertyType: parsed.data.managedPropertyType,
      message: parsed.data.message,
      referralCode: parsed.data.referralCode,
      passwordHash: await hashWorkspacePassword(parsed.data.password),
      ipAddress,
      userAgent: headerStore.get("user-agent"),
    });
  } catch (error) {
    if (error instanceof Error && FREE_WORKSPACE_ERRORS[error.message]) return FREE_WORKSPACE_ERRORS[error.message];
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { error: "An account detail was just registered. Check the name, email, and phone, then try again." };
    }
    logServerError("registerAction.freeWorkspace", error);
    return { error: "We could not create the workspace. Your details are still here; please try again." };
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
    if (appUrl) await sendVerificationEmail({ to: created.email, verifyUrl: `${appUrl}/verify-email?token=${created.verificationToken}` });
  } catch (error) {
    logServerError("registerAction.verification", error);
  }

  try {
    await setUserSession({ userId: created.userId, activeMembershipId: created.membershipId, replaceExistingSessions: true });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logServerError("registerAction.session", error);
    return { error: "Your workspace is ready. Sign in with the email and password you just chose." };
  }

  revalidatePath("/platform/onboarding");
  revalidatePath("/platform/organizations");
  redirect("/dashboard/org");
}
