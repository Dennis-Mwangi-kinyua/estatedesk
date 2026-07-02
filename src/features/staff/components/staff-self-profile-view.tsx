import type { Prisma } from "@prisma/client";
import { PushNotificationSettings } from "@/components/pwa/push-notification-settings";

type StaffSelfProfileViewProps = {
  title?: string;
  member: {
    role: string;
    employmentStartedAt: Date;
    org: {
      name: string;
    };
    staffProfile: {
      salaryAmount: Prisma.Decimal | null;
      salaryCurrency: string;
      educationLevel: string | null;
      jobTitle: string | null;
      nationalId: string | null;
      emergencyContact: string | null;
      notes: string | null;
    } | null;
    user: {
      fullName: string;
      username: string | null;
      email: string | null;
      phone: string | null;
      status: string;
      lastLoginAt: Date | null;
    };
  };
};

function formatDate(value: Date | null | undefined) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

function formatMoney(amount: Prisma.Decimal | null | undefined, currency: string) {
  if (!amount) return "Not captured";

  return `${currency} ${amount.toNumber().toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function StaffSelfProfileView({
  title = "My staff profile",
  member,
}: StaffSelfProfileViewProps) {
  const profile = member.staffProfile;

  return (
    <div className="space-y-5 text-slate-950 dark:text-slate-100">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:p-6">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {member.org.name}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          View the profile details your organisation has recorded for your
          employment account.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:p-6">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">
            Profile details
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="Full name" value={member.user.fullName} />
            <Info label="Username" value={member.user.username ?? "Not captured"} />
            <Info label="Role" value={member.role} />
            <Info label="Job title" value={profile?.jobTitle ?? "Not captured"} />
            <Info
              label="Education level"
              value={profile?.educationLevel ?? "Not captured"}
            />
            <Info
              label="Salary"
              value={formatMoney(profile?.salaryAmount, profile?.salaryCurrency ?? "KES")}
            />
            <Info
              label="National / employee ID"
              value={profile?.nationalId ?? "Not captured"}
            />
            <Info
              label="Emergency contact"
              value={profile?.emergencyContact ?? "Not captured"}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Notes
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
              {profile?.notes ?? "No staff profile notes have been captured."}
            </p>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:p-6">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">
            Account
          </h2>
          <div className="mt-4 space-y-3">
            <Info label="Email" value={member.user.email ?? "Not captured"} />
            <Info label="Phone" value={member.user.phone ?? "Not captured"} />
            <Info label="Status" value={member.user.status} />
            <Info label="Started" value={formatDate(member.employmentStartedAt)} />
            <Info label="Last login" value={formatDate(member.user.lastLoginAt)} />
          </div>
        </aside>
      </section>

      <PushNotificationSettings />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
