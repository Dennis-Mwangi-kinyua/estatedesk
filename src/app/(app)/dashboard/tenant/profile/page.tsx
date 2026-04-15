import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { RevealValue } from "@/components/tenant/reveal-value";

export const dynamic = "force-dynamic";

function maskPhone(value: string | null | undefined) {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return `${value.slice(0, 3)}••••${value.slice(-2)}`;
}

function maskEmail(value: string | null | undefined) {
  if (!value) return "—";
  const [name, domain] = value.split("@");
  if (!name || !domain) return value;
  return `${name.slice(0, 2)}••••@${domain}`;
}

function maskText(value: string | null | undefined, visible = 1, tail = 2) {
  if (!value) return "—";
  if (value.length <= visible + tail) return value;
  return `${value.slice(0, visible)}••••••${value.slice(-tail)}`;
}

function statusTone(status: string | null | undefined) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INACTIVE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "BLACKLISTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
  }
}

function yesNoTone(value: boolean) {
  return value
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-neutral-200 bg-neutral-50 text-neutral-600";
}

type InfoRowProps = {
  label: string;
  value: string;
  maskedValue?: string;
  reveal?: boolean;
};

function InfoRow({ label, value, maskedValue, reveal }: InfoRowProps) {
  return (
    <div className="rounded-[22px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] backdrop-blur">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>

      {reveal ? (
        <RevealValue masked={maskedValue ?? value} value={value} />
      ) : (
        <div className="mt-2">
          <p className="truncate text-sm font-semibold text-neutral-950">
            {value || "—"}
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] bg-neutral-50/90 p-4 ring-1 ring-neutral-200/70">
      <p className="text-[11px] text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

export default async function TenantProfilePage() {
  const session = await requireUserSession();

  const tenant = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      deletedAt: null,
    },
    include: {
      nextOfKin: true,
    },
  });

  if (!tenant) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
        No tenant profile is linked to your account.
      </div>
    );
  }

  const initials = tenant.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="overflow-hidden rounded-[26px] border border-neutral-200/80 bg-white/92 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur sm:rounded-[28px] sm:p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-neutral-950 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 sm:h-16 sm:w-16 sm:rounded-[20px] sm:text-base">
            {initials || "TP"}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
              Tenant Account
            </p>

            <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              {tenant.fullName}
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              {tenant.type === "COMPANY" ? "Company tenant" : "Individual tenant"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone(
                  tenant.status
                )}`}
              >
                {tenant.status}
              </span>

              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                Verified profile
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoRow
          label="Phone"
          value={tenant.phone ?? ""}
          maskedValue={maskPhone(tenant.phone)}
          reveal
        />
        <InfoRow
          label="Email"
          value={tenant.email ?? ""}
          maskedValue={maskEmail(tenant.email)}
          reveal
        />
        <InfoRow
          label="National ID"
          value={tenant.nationalId ?? ""}
          maskedValue={maskText(tenant.nationalId, 0, 2)}
          reveal
        />
        <InfoRow
          label="KRA PIN"
          value={tenant.kraPin ?? ""}
          maskedValue={maskText(tenant.kraPin, 1, 2)}
          reveal
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-[28px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur sm:p-5">
          <div>
            <p className="text-sm font-medium text-neutral-500">Personal Information</p>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
              Account and identity details
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow label="Full Name" value={tenant.fullName} />
            <InfoRow
              label="Tenant Type"
              value={tenant.type === "COMPANY" ? "Company" : "Individual"}
            />
            <InfoRow
              label="Phone"
              value={tenant.phone ?? ""}
              maskedValue={maskPhone(tenant.phone)}
              reveal
            />
            <InfoRow
              label="Email"
              value={tenant.email ?? ""}
              maskedValue={maskEmail(tenant.email)}
              reveal
            />
            <InfoRow
              label="National ID"
              value={tenant.nationalId ?? ""}
              maskedValue={maskText(tenant.nationalId, 0, 2)}
              reveal
            />
            <InfoRow
              label="KRA PIN"
              value={tenant.kraPin ?? ""}
              maskedValue={maskText(tenant.kraPin, 1, 2)}
              reveal
            />

            <div className="rounded-[22px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] backdrop-blur">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                Status
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone(
                    tenant.status
                  )}`}
                >
                  {tenant.status}
                </span>
              </div>
            </div>

            <div className="rounded-[22px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] backdrop-blur">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                Data Consent
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${yesNoTone(
                    tenant.dataConsent
                  )}`}
                >
                  {tenant.dataConsent ? "Granted" : "Not granted"}
                </span>
              </div>
            </div>

            <div className="rounded-[22px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] backdrop-blur sm:col-span-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                Marketing Consent
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${yesNoTone(
                    tenant.marketingConsent
                  )}`}
                >
                  {tenant.marketingConsent ? "Granted" : "Not granted"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur sm:p-5">
          <p className="text-sm font-medium text-neutral-500">Quick Summary</p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
            Profile snapshot
          </h2>

          <div className="mt-4 space-y-3">
            <SummaryTile label="Profile Name" value={tenant.fullName} />
            <SummaryTile
              label="Tenant Category"
              value={tenant.type === "COMPANY" ? "Company" : "Individual"}
            />
            <SummaryTile label="Profile Status" value={tenant.status} />
            <SummaryTile
              label="Data Consent"
              value={tenant.dataConsent ? "Granted" : "Not granted"}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur sm:p-5">
        <div>
          <p className="text-sm font-medium text-neutral-500">Next of Kin</p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
            Emergency contact on file
          </h2>
        </div>

        {!tenant.nextOfKin ? (
          <div className="mt-4 rounded-[22px] bg-neutral-50/90 p-4 text-sm text-neutral-500 ring-1 ring-neutral-200/70">
            No next of kin information has been added yet.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoRow label="Name" value={tenant.nextOfKin.name} />
            <InfoRow label="Relationship" value={tenant.nextOfKin.relationship} />
            <InfoRow
              label="Phone"
              value={tenant.nextOfKin.phone ?? ""}
              maskedValue={maskPhone(tenant.nextOfKin.phone)}
              reveal
            />
            <InfoRow
              label="Email"
              value={tenant.nextOfKin.email ?? ""}
              maskedValue={maskEmail(tenant.nextOfKin.email)}
              reveal
            />
          </div>
        )}
      </section>
    </div>
  );
}