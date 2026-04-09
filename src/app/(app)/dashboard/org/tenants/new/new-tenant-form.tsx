"use client";

import { useMemo, useState, useTransition } from "react";
import { createTenantAction } from "./actions";

type UnitOption = {
  id: string;
  label: string;
  houseNo: string;
  rentAmount: string;
  depositAmount: string;
};

type CaretakerOption = {
  id: string;
  name: string;
};

type Props = {
  orgId: string;
  orgName: string;
  units: UnitOption[];
  caretakers: CaretakerOption[];
};

type FormErrors = Partial<
  Record<
    | "fullName"
    | "phone"
    | "email"
    | "unitId"
    | "leaseStartDate"
    | "monthlyRent"
    | "manualPassword"
    | "confirmPassword",
    string
  >
>;

type ActionResult = {
  ok: boolean;
  message: string;
  tenantId?: string;
  temporaryCredentials?: {
    username: string;
    password: string;
  };
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function NewTenantForm({ orgId, orgName, units, caretakers }: Props) {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedCaretakerId, setSelectedCaretakerId] = useState("");
  const [leaseStartDate, setLeaseStartDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [passwordMode, setPasswordMode] = useState<"auto" | "manual">("auto");
  const [manualPassword, setManualPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === selectedUnitId) ?? null,
    [selectedUnitId, units],
  );

  function handleUnitChange(unitId: string) {
    setSelectedUnitId(unitId);

    const selected = units.find((unit) => unit.id === unitId);
    if (!selected) return;

    setMonthlyRent(selected.rentAmount);
    setDeposit(selected.depositAmount);
  }

  function validateStageOne() {
    const nextErrors: FormErrors = {};

    if (!fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!phone.trim()) nextErrors.phone = "Phone number is required.";
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!selectedUnitId) nextErrors.unitId = "Unit allocation is required.";
    if (!leaseStartDate) nextErrors.leaseStartDate = "Lease start date is required.";

    return nextErrors;
  }

  function validateStageTwo() {
    const nextErrors: FormErrors = {};

    if (!monthlyRent.trim()) nextErrors.monthlyRent = "Monthly rent is required.";

    if (passwordMode === "manual") {
      if (!manualPassword.trim()) {
        nextErrors.manualPassword = "Password is required.";
      } else if (manualPassword.trim().length < 6) {
        nextErrors.manualPassword = "Password must be at least 6 characters.";
      }

      if (!confirmPassword.trim()) {
        nextErrors.confirmPassword = "Please confirm the password.";
      } else if (manualPassword !== confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    return nextErrors;
  }

  function goToStageTwo() {
    const nextErrors = validateStageOne();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStage(2);
  }

  function goBackToStageOne() {
    setStage(1);
  }

  function handleSubmit() {
    const stageOneErrors = validateStageOne();
    const stageTwoErrors = validateStageTwo();
    const nextErrors = { ...stageOneErrors, ...stageTwoErrors };

    setErrors(nextErrors);
    setServerError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startTransition(async () => {
      const response = await createTenantAction({
        orgId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        nationalId: nationalId.trim() || null,
        unitId: selectedUnitId,
        caretakerUserId: selectedCaretakerId || null,
        leaseStartDate,
        monthlyRent,
        deposit: deposit.trim() || null,
        passwordMode,
        manualPassword: passwordMode === "manual" ? manualPassword : null,
      });

      if (!response.ok) {
        setServerError(response.message);
        return;
      }

      setResult(response);
      setStage(3);
    });
  }

  if (stage === 3 && result?.ok) {
    return (
      <div className="space-y-5">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm font-medium text-emerald-700">Tenant created successfully</p>
          <h2 className="mt-2 text-2xl font-semibold text-emerald-950">
            Registration completed
          </h2>
          <p className="mt-2 text-sm text-emerald-800">
            The tenant has been registered under {orgName} and allocated to the selected unit.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-950">Temporary login credentials</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Share these with the tenant after registration.
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-black/10 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Username</p>
                <p className="mt-2 text-sm font-semibold text-neutral-950">
                  {result.temporaryCredentials?.username ?? "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Password</p>
                <p className="mt-2 text-sm font-semibold text-neutral-950">
                  {result.temporaryCredentials?.password ?? "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-900">Important</p>
                <p className="mt-1 text-sm text-amber-800">
                  Ask the tenant to change this password after the first login.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-950">Saved details</h3>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">Full name</dt>
                <dd className="mt-1 text-sm font-medium text-neutral-950">{fullName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">Phone</dt>
                <dd className="mt-1 text-sm font-medium text-neutral-950">{phone}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">Email</dt>
                <dd className="mt-1 text-sm font-medium text-neutral-950">{email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                  Allocated unit
                </dt>
                <dd className="mt-1 text-sm font-medium text-neutral-950">
                  {selectedUnit?.label ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
            stage >= 1 ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-500",
          )}
        >
          1
        </div>
        <div className="h-px flex-1 bg-neutral-200" />
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
            stage >= 2 ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-500",
          )}
        >
          2
        </div>
      </div>

      {stage === 1 && (
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-neutral-950">
              Stage 1: Tenant details and unit allocation
            </h2>
            <p className="text-sm text-neutral-600">
              You cannot continue to stage 2 until stage 1 is complete.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">Full name *</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                placeholder="Enter tenant full name"
              />
              {errors.fullName && <p className="mt-2 text-xs text-red-600">{errors.fullName}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Phone number *
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                placeholder="e.g. 0712345678"
              />
              {errors.phone && <p className="mt-2 text-xs text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                placeholder="tenant@example.com"
              />
              {errors.email && <p className="mt-2 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">National ID</label>
              <input
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                placeholder="Optional"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Allocate unit *
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
              >
                <option value="">Select vacant unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label}
                  </option>
                ))}
              </select>
              {errors.unitId && <p className="mt-2 text-xs text-red-600">{errors.unitId}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">Caretaker</label>
              <select
                value={selectedCaretakerId}
                onChange={(e) => setSelectedCaretakerId(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
              >
                <option value="">No caretaker selected</option>
                {caretakers.map((caretaker) => (
                  <option key={caretaker.id} value={caretaker.id}>
                    {caretaker.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Lease start date *
              </label>
              <input
                type="date"
                value={leaseStartDate}
                onChange={(e) => setLeaseStartDate(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
              />
              {errors.leaseStartDate && (
                <p className="mt-2 text-xs text-red-600">{errors.leaseStartDate}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={goToStageTwo}
              className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Continue to stage 2
            </button>
          </div>
        </div>
      )}

      {stage === 2 && (
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-neutral-950">
              Stage 2: Rent and login setup
            </h2>
            <p className="text-sm text-neutral-600">
              Finish registration and generate or set temporary credentials.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Monthly rent *
              </label>
              <input
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                placeholder="e.g. 15000"
              />
              {errors.monthlyRent && (
                <p className="mt-2 text-xs text-red-600">{errors.monthlyRent}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">Deposit</label>
              <input
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                placeholder="e.g. 15000"
              />
            </div>

            <div className="md:col-span-2 rounded-2xl border border-black/10 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-900">Password setup</p>

              <div className="mt-3 flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="radio"
                    checked={passwordMode === "auto"}
                    onChange={() => setPasswordMode("auto")}
                  />
                  Auto-generate temporary password
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="radio"
                    checked={passwordMode === "manual"}
                    onChange={() => setPasswordMode("manual")}
                  />
                  Set password manually
                </label>
              </div>

              {passwordMode === "manual" && (
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-800">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={manualPassword}
                      onChange={(e) => setManualPassword(e.target.value)}
                      className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                    />
                    {errors.manualPassword && (
                      <p className="mt-2 text-xs text-red-600">{errors.manualPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-800">
                      Confirm password *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-2 text-xs text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-900">Allocated unit</p>
              <p className="mt-1 text-sm text-emerald-800">{selectedUnit?.label ?? "—"}</p>
            </div>
          </div>

          {serverError && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={goBackToStageOne}
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Back to stage 1
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Registering tenant..." : "Finish registration"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}