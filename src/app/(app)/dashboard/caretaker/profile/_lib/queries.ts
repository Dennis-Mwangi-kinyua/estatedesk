import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { PROFILE_LOAD_ERROR_MESSAGE } from "./helpers";

const memberSelect = {
  role: true,
  employmentStartedAt: true,
  org: {
    select: {
      name: true,
    },
  },
  staffProfile: {
    select: {
      salaryAmount: true,
      salaryCurrency: true,
      educationLevel: true,
      jobTitle: true,
      nationalId: true,
      emergencyContact: true,
      notes: true,
    },
  },
  user: {
    select: {
      fullName: true,
      username: true,
      email: true,
      phone: true,
      status: true,
      lastLoginAt: true,
    },
  },
} as const;

export async function getCaretakerProfileData(args: {
  orgId: string;
  userId: string;
}) {
  try {
    const member = await retryTransientDatabaseOperation(
      () =>
        prisma.membership.findFirst({
          where: {
            orgId: args.orgId,
            userId: args.userId,
            role: "CARETAKER",
            employmentEndedAt: null,
          },
          select: memberSelect,
        }),
      { label: "caretaker profile page data" },
    );

    return {
      ok: true as const,
      member,
    };
  } catch (error) {
    logServerError("caretaker.profile.load", error);

    return {
      ok: false as const,
      errorMessage: PROFILE_LOAD_ERROR_MESSAGE,
      member: null,
    };
  }
}