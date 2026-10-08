"use client";

import { useActionState, useMemo, useState, useEffect, useRef } from "react";
import type { CreateOrganizationState } from "../actions";
import { validateAccountStep } from "../_lib/form-validation";
import { initialState } from "../_lib/constants";

type CreateOrganizationAction = (
  prevState: CreateOrganizationState,
  formData: FormData,
) => Promise<CreateOrganizationState>;

export function useNewOrgForm(createOrganizationAction: CreateOrganizationAction, checkAvailability: (values: Record<string, string>) => Promise<Record<string, string[]>>, initialValues?: Record<string, string>, draftKey = "organisation-draft") {
  const [state, formAction, pending] = useActionState(
    createOrganizationAction,
    initialState,
  );
  const [step, setStep] = useState(1);
  const [attemptedSteps, setAttemptedSteps] = useState<number[]>([]);

  const [organizationName, setOrganizationName] = useState(initialValues?.organizationName ?? "");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [organizationEmail, setOrganizationEmail] = useState(initialValues?.organizationEmail ?? "");
  const [organizationPhone, setOrganizationPhone] = useState(initialValues?.organizationPhone ?? "");
  const [organizationAddress, setOrganizationAddress] = useState("");
  const [currencyCode, setCurrencyCode] = useState("KES");
  const [timezone, setTimezone] = useState("Africa/Nairobi");
  const [dataRetentionDays, setDataRetentionDays] = useState("2555");
  const [plan, setPlan] = useState("FREE");
  const [accountType, setAccountType] = useState("PROPERTY_MANAGER");

  const [adminFullName, setAdminFullName] = useState(initialValues?.adminFullName ?? "");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState(initialValues?.adminEmail ?? "");
  const [adminPhone, setAdminPhone] = useState(initialValues?.adminPhone ?? "");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");

  const generatedSlug = useMemo(() => {
    const base = organizationSlug || organizationName;
    return base
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  }, [organizationName, organizationSlug]);

  const values = useMemo(() => ({ organizationName, organizationSlug, organizationPhone, adminPhone, organizationEmail, timezone, dataRetentionDays, plan, accountType, adminFullName, adminUsername, adminEmail, adminPassword, adminPasswordConfirm }), [organizationName, organizationSlug, organizationPhone, adminPhone, organizationEmail, timezone, dataRetentionDays, plan, accountType, adminFullName, adminUsername, adminEmail, adminPassword, adminPasswordConfirm]);
  const [availabilitySnapshot, setAvailabilitySnapshot] = useState("");
  const [availabilityErrors, setAvailabilityErrors] = useState<Record<string, string[]>>({});
  const [checking, setChecking] = useState(false);
  const [availabilityNotice, setAvailabilityNotice] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const valuesRef = useRef(values);
  useEffect(() => { valuesRef.current = values; }, [values]);
  const [serverSnapshot, setServerSnapshot] = useState("");
  const setters: Record<string, (value: string) => void> = { organizationName: setOrganizationName, organizationSlug: setOrganizationSlug, organizationEmail: setOrganizationEmail, organizationPhone: setOrganizationPhone, organizationAddress: setOrganizationAddress, currencyCode: setCurrencyCode, timezone: setTimezone, dataRetentionDays: setDataRetentionDays, plan: setPlan, accountType: setAccountType, adminFullName: setAdminFullName, adminUsername: setAdminUsername, adminEmail: setAdminEmail, adminPhone: setAdminPhone };
  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
    try { const draft = JSON.parse(sessionStorage.getItem(draftKey) || "null"); if (draft) { for (const [key, value] of Object.entries(draft)) if (typeof value === "string") setters[key]?.(value); setRestored(true); } } catch { /* storage unavailable */ }
    setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);
  useEffect(() => {
    if (!draftReady) return;
    try { if (state.success) sessionStorage.removeItem(draftKey); else if (values.organizationName || values.adminFullName) sessionStorage.setItem(draftKey, JSON.stringify({ ...values, adminPassword: undefined, adminPasswordConfirm: undefined, organizationAddress, currencyCode })); } catch { /* storage unavailable */ }
  }, [draftReady, draftKey, state.success, values, organizationAddress, currencyCode]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (!state.success && (organizationName || adminFullName)) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [state.success, organizationName, adminFullName]);
  const currentSnapshot = JSON.stringify({ ...values, organizationAddress, currencyCode });
  const clientErrors: Record<string, string[]> = Object.assign({}, ...attemptedSteps.map((value) => validateAccountStep(value, values)));
  const displayState: CreateOrganizationState = { ...state, error: serverSnapshot === currentSnapshot ? state.error : undefined, fieldErrors: { ...(serverSnapshot === currentSnapshot ? state.fieldErrors : {}), ...clientErrors, ...(availabilitySnapshot === currentSnapshot ? availabilityErrors : {}) } };

  function canGoStep2() { return Object.keys(validateAccountStep(1, values)).length === 0; }
  function canGoStep3() { return Object.keys(validateAccountStep(2, values)).length === 0; }

  async function nextStep() {
    setAttemptedSteps((current) => current.includes(step) ? current : [...current, step]);
    if (Object.keys(validateAccountStep(step, values)).length) return;
    setChecking(true); setAvailabilityNotice("");
    const snapshot = JSON.stringify(values);
    try {
      const errors = await checkAvailability({ organizationName, organizationSlug, adminUsername, adminEmail, adminPhone });
      if (JSON.stringify(valuesRef.current) !== snapshot) return;
      const relevant = Object.fromEntries(Object.entries(errors).filter(([key]) => step === 1 ? !key.startsWith("admin") : key.startsWith("admin")));
      setAvailabilityErrors(relevant);
      setAvailabilitySnapshot(currentSnapshot);
      if (!Object.keys(relevant).length) setStep((current) => Math.min(3, current + 1));
    } catch { setAvailabilityNotice("Availability could not be checked. Try again."); } finally { setChecking(false); }
  }

  function prevStep() {
    setStep((current) => Math.max(1, current - 1));
  }

  return {
    restored, checking, availabilityNotice,
    captureSubmission: () => setServerSnapshot(currentSnapshot),
    state: displayState,
    setStep,
    formAction,
    pending,
    step,
    organizationName,
    setOrganizationName,
    organizationSlug,
    setOrganizationSlug,
    organizationEmail,
    setOrganizationEmail,
    organizationPhone,
    setOrganizationPhone,
    organizationAddress,
    setOrganizationAddress,
    currencyCode,
    setCurrencyCode,
    timezone,
    setTimezone,
    dataRetentionDays,
    setDataRetentionDays,
    plan,
    setPlan,
    accountType,
    setAccountType,
    adminFullName,
    setAdminFullName,
    adminUsername,
    setAdminUsername,
    adminEmail,
    setAdminEmail,
    adminPhone,
    setAdminPhone,
    adminPassword,
    setAdminPassword,
    adminPasswordConfirm,
    setAdminPasswordConfirm,
    generatedSlug,
    canGoStep2,
    canGoStep3,
    nextStep,
    prevStep,
  };
}

export type NewOrgFormState = ReturnType<typeof useNewOrgForm>;