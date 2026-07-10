"use client";

import { useActionState, useMemo, useState } from "react";
import type { CreateOrganizationState } from "../actions";
import { initialState } from "../_lib/constants";

type CreateOrganizationAction = (
  prevState: CreateOrganizationState,
  formData: FormData,
) => Promise<CreateOrganizationState>;

export function useNewOrgForm(createOrganizationAction: CreateOrganizationAction) {
  const [state, formAction, pending] = useActionState(
    createOrganizationAction,
    initialState,
  );
  const [step, setStep] = useState(1);

  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [organizationEmail, setOrganizationEmail] = useState("");
  const [organizationPhone, setOrganizationPhone] = useState("");
  const [organizationAddress, setOrganizationAddress] = useState("");
  const [currencyCode, setCurrencyCode] = useState("KES");
  const [timezone, setTimezone] = useState("Africa/Nairobi");
  const [dataRetentionDays, setDataRetentionDays] = useState("2555");
  const [plan, setPlan] = useState("FREE");
  const [accountType, setAccountType] = useState("PROPERTY_MANAGER");

  const [adminFullName, setAdminFullName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
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

  function canGoStep2() {
    return (
      organizationName.trim().length >= 2 &&
      timezone.trim().length > 0 &&
      plan.trim().length > 0
    );
  }

  function canGoStep3() {
    return (
      adminFullName.trim().length >= 2 &&
      /^[a-z0-9._-]{3,30}$/.test(adminUsername.trim()) &&
      adminEmail.trim().length > 0 &&
      adminPassword.length >= 8 &&
      adminPassword === adminPasswordConfirm
    );
  }

  function nextStep() {
    if (step === 1 && canGoStep2()) {
      setStep(2);
      return;
    }

    if (step === 2 && canGoStep3()) {
      setStep(3);
    }
  }

  function prevStep() {
    setStep((current) => Math.max(1, current - 1));
  }

  return {
    state,
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