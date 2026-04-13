"use client";

import Image from "next/image";
import Link from "next/link";
import {
  memo,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronRight,
  Eye,
  EyeOff,
  LockKeyhole,
  PencilLine,
  ShieldCheck,
  UserCircle2,
  X,
} from "lucide-react";

import type { TenantProfileViewModel } from "@/app/(app)/dashboard/tenant/profile/page";
import { verifyTenantPassword } from "@/app/(app)/dashboard/tenant/profile/actions";

type SensitiveFieldKey =
  | "phone"
  | "email"
  | "nationalId"
  | "kraPin"
  | "nextOfKinPhone"
  | "nextOfKinEmail";

type RevealState = Record<SensitiveFieldKey, boolean>;

const INITIAL_REVEAL_STATE: RevealState = {
  phone: false,
  email: false,
  nationalId: false,
  kraPin: false,
  nextOfKinPhone: false,
  nextOfKinEmail: false,
};

const FIELD_LABELS: Record<SensitiveFieldKey, string> = {
  phone: "Phone",
  email: "Email",
  nationalId: "National ID",
  kraPin: "KRA PIN",
  nextOfKinPhone: "Next of Kin Phone",
  nextOfKinEmail: "Next of Kin Email",
};

function displayValue(value?: string | null) {
  if (!value || value.trim() === "") return "Not provided";
  return value;
}

function humanizeTenantType(type?: TenantProfileViewModel["type"]) {
  if (!type) return "Not available";
  return type === "COMPANY" ? "Company" : "Individual";
}

function humanizeStatus(status?: TenantProfileViewModel["status"]) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "INACTIVE":
      return "Inactive";
    case "BLACKLISTED":
      return "Blacklisted";
    default:
      return "Unknown";
  }
}

function statusBadgeStyles(status?: TenantProfileViewModel["status"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-200";
    case "INACTIVE":
      return "bg-amber-500/10 text-amber-700 ring-amber-200";
    case "BLACKLISTED":
      return "bg-red-500/10 text-red-700 ring-red-200";
    default:
      return "bg-neutral-500/10 text-neutral-700 ring-neutral-200";
  }
}

function initialsFromName(name?: string | null) {
  if (!name) return "T";

  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "T"
  );
}

function maskPhone(value?: string | null) {
  if (!value || value.trim() === "") return "Not provided";

  const cleaned = value.trim();
  if (cleaned.length <= 4) return "••••";

  return `${cleaned.slice(0, 3)}••••${cleaned.slice(-2)}`;
}

function maskEmail(value?: string | null) {
  if (!value || value.trim() === "") return "Not provided";

  const [local, domain] = value.split("@");
  if (!local || !domain) return "Hidden";

  const visibleLocal =
    local.length <= 2 ? `${local[0] ?? ""}•••` : `${local.slice(0, 2)}••••`;

  return `${visibleLocal}@${domain}`;
}

function maskNationalId(value?: string | null) {
  if (!value || value.trim() === "") return "Not provided";

  const cleaned = value.trim();
  if (cleaned.length <= 2) return "••••";

  return `••••••${cleaned.slice(-2)}`;
}

function maskKraPin(value?: string | null) {
  if (!value || value.trim() === "") return "Not provided";

  const cleaned = value.trim();
  if (cleaned.length <= 3) return "••••••";

  return `${cleaned.slice(0, 1)}••••••${cleaned.slice(-2)}`;
}

function getMaskedValue(field: SensitiveFieldKey, value?: string | null) {
  switch (field) {
    case "phone":
    case "nextOfKinPhone":
      return maskPhone(value);
    case "email":
    case "nextOfKinEmail":
      return maskEmail(value);
    case "nationalId":
      return maskNationalId(value);
    case "kraPin":
      return maskKraPin(value);
    default:
      return "Hidden";
  }
}

function getVisibleValue(
  revealed: boolean,
  field: SensitiveFieldKey,
  value?: string | null
) {
  return revealed ? displayValue(value) : getMaskedValue(field, value);
}

const MobileEmoji = memo(function MobileEmoji({
  symbol,
  className = "",
}: {
  symbol: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-neutral-100 text-base ${className}`}
      aria-hidden="true"
    >
      {symbol}
    </span>
  );
});

const IOSDivider = memo(function IOSDivider() {
  return <div className="ml-16 h-px bg-neutral-200 sm:ml-5" />;
});

const IOSGroup = memo(function IOSGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section>
      {title ? (
        <p className="mb-2 px-4 text-[13px] font-medium uppercase tracking-[0.08em] text-neutral-500 sm:px-1">
          {title}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {children}
      </div>
    </section>
  );
});

const TopSummaryCard = memo(function TopSummaryCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-neutral-900">
        {value}
      </p>
    </div>
  );
});

const DesktopField = memo(function DesktopField({
  label,
  value,
  onReveal,
  isSensitive = false,
  revealed = false,
}: {
  label: string;
  value: ReactNode;
  onReveal?: () => void;
  isSensitive?: boolean;
  revealed?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">{label}</p>

        {isSensitive && onReveal ? (
          <button
            type="button"
            onClick={onReveal}
            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200 transition hover:bg-neutral-50"
          >
            {revealed ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Reveal
              </>
            )}
          </button>
        ) : null}
      </div>

      <p className="mt-1 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  );
});

const IOSRow = memo(function IOSRow({
  label,
  value,
  href,
  emoji,
}: {
  label: string;
  value: ReactNode;
  href?: string;
  emoji?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      {emoji ? (
        <div className="shrink-0 lg:hidden">
          <MobileEmoji symbol={emoji} />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-neutral-900">{label}</p>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div className="max-w-[180px] truncate text-right text-[15px] font-medium text-neutral-500 sm:max-w-none">
          {value}
        </div>
        {href ? <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" /> : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block transition active:scale-[0.995] active:bg-neutral-50"
      >
        {content}
      </Link>
    );
  }

  return content;
});

const SensitiveValueButton = memo(function SensitiveValueButton({
  label,
  value,
  fieldKey,
  revealed,
  onRequestReveal,
  emoji,
}: {
  label: string;
  value?: string | null;
  fieldKey: SensitiveFieldKey;
  revealed: boolean;
  onRequestReveal: (field: SensitiveFieldKey) => void;
  emoji?: string;
}) {
  const shownValue = getVisibleValue(revealed, fieldKey, value);

  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      {emoji ? (
        <div className="shrink-0 lg:hidden">
          <MobileEmoji symbol={emoji} />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-neutral-900">{label}</p>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div className="max-w-[180px] truncate text-right text-[15px] font-medium text-neutral-500 sm:max-w-none">
          {shownValue}
        </div>

        <button
          type="button"
          onClick={() => onRequestReveal(fieldKey)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
          aria-label={revealed ? `Hide ${label}` : `Reveal ${label}`}
        >
          {revealed ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <LockKeyhole className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
});

const PasswordConfirmModal = memo(function PasswordConfirmModal({
  isOpen,
  isSubmitting,
  password,
  setPassword,
  error,
  fieldLabel,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  isSubmitting: boolean;
  password: string;
  setPassword: (value: string) => void;
  error: string | null;
  fieldLabel: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal overlay"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-md"
      />

      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/40 bg-white/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
              <LockKeyhole className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-neutral-950">
              Confirm your password
            </h2>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Enter your login password to reveal {fieldLabel.toLowerCase()}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5">
          <label
            htmlFor="tenant-password-confirm"
            className="mb-2 block text-sm font-medium text-neutral-700"
          >
            Login password
          </label>

          <input
            id="tenant-password-confirm"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
            autoFocus
          />

          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || password.trim().length === 0}
            className="flex-1 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Checking..." : "Reveal"}
          </button>
        </div>
      </div>
    </div>
  );
});

function TenantProfileView({ tenant }: { tenant: TenantProfileViewModel }) {
  const [revealed, setRevealed] = useState<RevealState>(INITIAL_REVEAL_STATE);
  const [activeField, setActiveField] = useState<SensitiveFieldKey | null>(null);
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials = useMemo(() => initialsFromName(tenant.fullName), [tenant.fullName]);
  const statusLabel = useMemo(() => humanizeStatus(tenant.status), [tenant.status]);
  const tenantTypeLabel = useMemo(() => humanizeTenantType(tenant.type), [tenant.type]);

  const phoneValue = useMemo(
    () => getVisibleValue(revealed.phone, "phone", tenant.phone),
    [revealed.phone, tenant.phone]
  );
  const emailValue = useMemo(
    () => getVisibleValue(revealed.email, "email", tenant.email),
    [revealed.email, tenant.email]
  );
  const nationalIdValue = useMemo(
    () => getVisibleValue(revealed.nationalId, "nationalId", tenant.nationalId),
    [revealed.nationalId, tenant.nationalId]
  );
  const kraPinValue = useMemo(
    () => getVisibleValue(revealed.kraPin, "kraPin", tenant.kraPin),
    [revealed.kraPin, tenant.kraPin]
  );
  const nextOfKinPhoneValue = useMemo(
    () =>
      getVisibleValue(
        revealed.nextOfKinPhone,
        "nextOfKinPhone",
        tenant.nextOfKin?.phone
      ),
    [revealed.nextOfKinPhone, tenant.nextOfKin?.phone]
  );
  const nextOfKinEmailValue = useMemo(
    () =>
      getVisibleValue(
        revealed.nextOfKinEmail,
        "nextOfKinEmail",
        tenant.nextOfKin?.email
      ),
    [revealed.nextOfKinEmail, tenant.nextOfKin?.email]
  );

  const activeFieldLabel = activeField ? FIELD_LABELS[activeField] : "this field";

  const closeModal = useCallback(() => {
    setActiveField(null);
    setPassword("");
    setSubmitError(null);
    setIsSubmitting(false);
  }, []);

  const handleRequestReveal = useCallback((field: SensitiveFieldKey) => {
    setSubmitError(null);

    setRevealed((prev) => {
      if (prev[field]) {
        setActiveField(null);
        return {
          ...prev,
          [field]: false,
        };
      }

      setActiveField(field);
      return prev;
    });

    setPassword("");
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
  }, []);

  const handleConfirmReveal = useCallback(async () => {
    if (!activeField) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const result = await verifyTenantPassword(password);

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }

      setRevealed((prev) => ({
        ...prev,
        [activeField]: true,
      }));

      closeModal();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [activeField, closeModal, password]);

  return (
    <>
      <div className="min-h-full bg-[#f2f2f7]">
        <div className="mx-auto w-full max-w-6xl px-3 pb-28 pt-4 sm:px-4 sm:pt-6 lg:px-8 lg:pb-10">
          <div className="mx-auto max-w-3xl lg:max-w-6xl">
            <div className="space-y-4 lg:space-y-6">
              <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
                <div className="px-5 pb-5 pt-6 sm:px-6 lg:px-8 lg:pt-8">
                  <div className="flex flex-col items-center text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
                    <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-5">
                      <div className="relative h-24 w-24 overflow-hidden rounded-[28px] bg-neutral-100 ring-4 ring-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
                        {tenant.profileImageUrl ? (
                          <Image
                            src={tenant.profileImageUrl}
                            alt={`${tenant.fullName} profile photo`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-100 text-2xl font-semibold text-neutral-800">
                            {initials}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 lg:mt-0">
                        <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                          <UserCircle2 className="h-3.5 w-3.5" />
                          Tenant account
                        </div>

                        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-[30px]">
                          {tenant.fullName}
                        </h1>

                        <p className="mt-1 text-sm text-neutral-500">
                          {tenantTypeLabel}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeStyles(
                              tenant.status
                            )}`}
                          >
                            {statusLabel}
                          </span>

                          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                            Verified profile
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 hidden lg:block">
                      <Link
                        href="/dashboard/tenant/profile/edit"
                        className="inline-flex items-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                      >
                        <PencilLine className="h-4 w-4" />
                        Edit Profile
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <TopSummaryCard label="Phone" value={phoneValue} />
                    <TopSummaryCard label="Email" value={emailValue} />
                    <TopSummaryCard label="National ID" value={nationalIdValue} />
                    <TopSummaryCard label="KRA PIN" value={kraPinValue} />
                  </div>
                </div>
              </section>

              <div className="space-y-5 lg:hidden">
                <IOSGroup title="Account">
                  <IOSRow
                    label="Full Name"
                    value={displayValue(tenant.fullName)}
                    href="/dashboard/tenant/profile/edit"
                    emoji="👤"
                  />
                  <IOSDivider />
                  <IOSRow label="Tenant Type" value={tenantTypeLabel} emoji="🏠" />
                  <IOSDivider />
                  <SensitiveValueButton
                    label="Phone"
                    value={tenant.phone}
                    fieldKey="phone"
                    revealed={revealed.phone}
                    onRequestReveal={handleRequestReveal}
                    emoji="📞"
                  />
                  <IOSDivider />
                  <SensitiveValueButton
                    label="Email"
                    value={tenant.email}
                    fieldKey="email"
                    revealed={revealed.email}
                    onRequestReveal={handleRequestReveal}
                    emoji="✉️"
                  />
                  <IOSDivider />
                  <IOSRow label="Status" value={statusLabel} emoji="✅" />
                </IOSGroup>

                <IOSGroup title="Identity">
                  <SensitiveValueButton
                    label="National ID"
                    value={tenant.nationalId}
                    fieldKey="nationalId"
                    revealed={revealed.nationalId}
                    onRequestReveal={handleRequestReveal}
                    emoji="🪪"
                  />
                  <IOSDivider />
                  <SensitiveValueButton
                    label="KRA PIN"
                    value={tenant.kraPin}
                    fieldKey="kraPin"
                    revealed={revealed.kraPin}
                    onRequestReveal={handleRequestReveal}
                    emoji="🧾"
                  />
                  {tenant.type === "COMPANY" ? (
                    <>
                      <IOSDivider />
                      <IOSRow
                        label="Company Name"
                        value={displayValue(tenant.companyName)}
                        emoji="🏢"
                      />
                    </>
                  ) : null}
                </IOSGroup>

                <IOSGroup title="Preferences">
                  <IOSRow
                    label="Data Consent"
                    value={tenant.dataConsent ? "Granted" : "Not granted"}
                    emoji="🔒"
                  />
                  <IOSDivider />
                  <IOSRow
                    label="Marketing Consent"
                    value={tenant.marketingConsent ? "Granted" : "Not granted"}
                    emoji="📣"
                  />
                </IOSGroup>

                <IOSGroup title="Next of Kin">
                  {tenant.nextOfKin ? (
                    <>
                      <IOSRow
                        label="Name"
                        value={displayValue(tenant.nextOfKin.name)}
                        emoji="🧑‍🤝‍🧑"
                      />
                      <IOSDivider />
                      <IOSRow
                        label="Relationship"
                        value={displayValue(tenant.nextOfKin.relationship)}
                        emoji="💛"
                      />
                      <IOSDivider />
                      <SensitiveValueButton
                        label="Phone"
                        value={tenant.nextOfKin.phone}
                        fieldKey="nextOfKinPhone"
                        revealed={revealed.nextOfKinPhone}
                        onRequestReveal={handleRequestReveal}
                        emoji="📱"
                      />
                      <IOSDivider />
                      <SensitiveValueButton
                        label="Email"
                        value={tenant.nextOfKin.email}
                        fieldKey="nextOfKinEmail"
                        revealed={revealed.nextOfKinEmail}
                        onRequestReveal={handleRequestReveal}
                        emoji="📧"
                      />
                    </>
                  ) : (
                    <div className="px-4 py-5 text-[15px] text-neutral-500">
                      No next of kin details added yet.
                    </div>
                  )}
                </IOSGroup>
              </div>

              <div className="hidden gap-6 lg:grid lg:grid-cols-12">
                <section className="col-span-7 overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-900">
                        Personal Information
                      </h2>
                      <p className="mt-1 text-sm text-neutral-500">
                        Account and identity details associated with this tenant
                        profile.
                      </p>
                    </div>

                    <Link
                      href="/dashboard/tenant/profile/edit"
                      className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
                    >
                      <PencilLine className="h-4 w-4" />
                      Edit Profile
                    </Link>
                  </div>

                  <div className="grid gap-4 p-6 md:grid-cols-2">
                    <DesktopField
                      label="Full Name"
                      value={displayValue(tenant.fullName)}
                    />
                    <DesktopField label="Tenant Type" value={tenantTypeLabel} />
                    <DesktopField
                      label="Phone"
                      value={phoneValue}
                      isSensitive
                      revealed={revealed.phone}
                      onReveal={() => handleRequestReveal("phone")}
                    />
                    <DesktopField
                      label="Email"
                      value={emailValue}
                      isSensitive
                      revealed={revealed.email}
                      onReveal={() => handleRequestReveal("email")}
                    />
                    <DesktopField
                      label="National ID"
                      value={nationalIdValue}
                      isSensitive
                      revealed={revealed.nationalId}
                      onReveal={() => handleRequestReveal("nationalId")}
                    />
                    <DesktopField
                      label="KRA PIN"
                      value={kraPinValue}
                      isSensitive
                      revealed={revealed.kraPin}
                      onReveal={() => handleRequestReveal("kraPin")}
                    />
                    <DesktopField label="Status" value={statusLabel} />
                    <DesktopField
                      label="Data Consent"
                      value={tenant.dataConsent ? "Granted" : "Not granted"}
                    />
                    <DesktopField
                      label="Marketing Consent"
                      value={tenant.marketingConsent ? "Granted" : "Not granted"}
                    />
                    {tenant.type === "COMPANY" ? (
                      <DesktopField
                        label="Company Name"
                        value={displayValue(tenant.companyName)}
                      />
                    ) : null}
                  </div>
                </section>

                <section className="col-span-5 overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
                  <div className="border-b border-neutral-100 px-6 py-5">
                    <h2 className="text-lg font-semibold text-neutral-900">
                      Next of Kin
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Emergency contact information on file.
                    </p>
                  </div>

                  <div className="space-y-4 p-6">
                    {tenant.nextOfKin ? (
                      <>
                        <DesktopField
                          label="Name"
                          value={displayValue(tenant.nextOfKin.name)}
                        />
                        <DesktopField
                          label="Relationship"
                          value={displayValue(tenant.nextOfKin.relationship)}
                        />
                        <DesktopField
                          label="Phone"
                          value={nextOfKinPhoneValue}
                          isSensitive
                          revealed={revealed.nextOfKinPhone}
                          onReveal={() => handleRequestReveal("nextOfKinPhone")}
                        />
                        <DesktopField
                          label="Email"
                          value={nextOfKinEmailValue}
                          isSensitive
                          revealed={revealed.nextOfKinEmail}
                          onReveal={() => handleRequestReveal("nextOfKinEmail")}
                        />
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-500">
                        No next of kin details added yet.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <Link
              href="/dashboard/tenant/profile/edit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-[18px] bg-neutral-950 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition active:scale-[0.99]"
            >
              <PencilLine className="h-4 w-4" />
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <PasswordConfirmModal
        isOpen={Boolean(activeField)}
        isSubmitting={isSubmitting}
        password={password}
        setPassword={handlePasswordChange}
        error={submitError}
        fieldLabel={activeFieldLabel}
        onClose={closeModal}
        onSubmit={handleConfirmReveal}
      />
    </>
  );
}

export default memo(TenantProfileView);