"use client";

import {
  useActionState,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createTenantAction } from "@/features/tenants/actions/create-tenant-action";
import { FormActionsDesktop, FormActionsMobile } from "./_components/form-actions";
import { NewTenantGuidance } from "./_components/new-tenant-guidance";
import { NewTenantHeader } from "./_components/new-tenant-header";
import { StepAccountDetails } from "./_components/step-account-details";
import { StepChip } from "./_components/step-chip";
import { StepNextOfKin } from "./_components/step-next-of-kin";
import { StepPreview } from "./_components/step-preview";
import { StepTenantDetails } from "./_components/step-tenant-details";
import { StepUnitLease } from "./_components/step-unit-lease";
import { TenantSuccessView } from "./_components/tenant-success-view";
import { ErrorNotice, panelShellClassName, WarningNotice } from "./_components/ui-primitives";
import { buildPreview } from "./_lib/build-preview";
import { initialCreateTenantActionState, stepItems } from "./_lib/constants";
import {
  buildUsernamePreview,
  generateClientPassword,
  getNextStep,
  getPreviousStep,
} from "./_lib/helpers";
import type { NewTenantFormProps, PreviewData, Step } from "./_lib/types";
import {
  validateStepFour,
  validateStepOne,
  validateStepThree,
  validateStepTwo,
} from "./_lib/validation";

export function NewTenantForm({
  orgName,
  currencyCode,
  availableUnits,
}: NewTenantFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  const [state, formAction, isPending] = useActionState(
    createTenantAction,
    initialCreateTenantActionState,
  );

  const [step, setStep] = useState<Step>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [accountUsername, setAccountUsername] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountConfirmPassword, setAccountConfirmPassword] = useState("");

  const selectedUnit = useMemo(
    () => availableUnits.find((unit) => unit.id === selectedUnitId) ?? null,
    [availableUnits, selectedUnitId],
  );

  function suggestUsername(form: HTMLFormElement) {
    const fullName = String(new FormData(form).get("fullName") ?? "").trim();
    if (!fullName) return;
    setAccountUsername((current) => current || buildUsernamePreview(fullName));
  }

  function handleGeneratePassword() {
    const password = generateClientPassword(10);
    setAccountPassword(password);
    setAccountConfirmPassword(password);
  }

  function handleNext(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form || isPending) return;

    if (step === 1) {
      const error = validateStepOne(form);
      if (error) {
        setStepError(error);
        return;
      }
    }

    if (step === 2) {
      const error = validateStepTwo(form);
      if (error) {
        setStepError(error);
        return;
      }
    }

    if (step === 3) {
      const error = validateStepThree(form);
      if (error) {
        setStepError(error);
        return;
      }
      suggestUsername(form);
    }

    if (step === 4) {
      const error = validateStepFour(form);
      if (error) {
        setStepError(error);
        return;
      }
      setPreview(buildPreview(form, selectedUnit));
    }

    setStepError(null);
    setStep((current) => getNextStep(current));
    setTimeout(() => {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function handleBack() {
    if (isPending) return;
    setStep((current) => getPreviousStep(current));
    setStepError(null);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  if (state.status === "success" && state.credentials) {
    return <TenantSuccessView state={state} />;
  }

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <NewTenantHeader
        orgName={orgName}
        availableUnitsCount={availableUnits.length}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className={panelShellClassName}>
          <div className="border-b border-border bg-muted/10 px-4 py-4 sm:px-6">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="flex min-w-max gap-3 sm:grid sm:min-w-0 sm:grid-cols-2 lg:grid-cols-5">
                {stepItems.map((item) => (
                  <StepChip
                    key={item.id}
                    item={item}
                    active={step === item.id}
                    complete={step > item.id}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <div aria-live="polite" aria-atomic="true" className="mb-5 space-y-3">
              {state.status === "error" && state.message ? (
                <ErrorNotice>{state.message}</ErrorNotice>
              ) : null}

              {stepError ? <WarningNotice>{stepError}</WarningNotice> : null}
            </div>

            <form
              id="new-tenant-form"
              ref={formRef}
              action={formAction}
              className="space-y-6"
            >
              <input type="hidden" name="unitId" value={selectedUnitId} />

              <section className={step === 1 ? "block" : "hidden"}>
                <StepTenantDetails isPending={isPending} />
              </section>

              <section className={step === 2 ? "block" : "hidden"}>
                <StepNextOfKin isPending={isPending} />
              </section>

              <section className={step === 3 ? "block" : "hidden"}>
                <StepUnitLease
                  isPending={isPending}
                  currencyCode={currencyCode}
                  availableUnits={availableUnits}
                  selectedUnitId={selectedUnitId}
                  selectedUnit={selectedUnit}
                  onSelectUnit={setSelectedUnitId}
                />
              </section>

              <section className={step === 4 ? "block" : "hidden"}>
                <StepAccountDetails
                  isPending={isPending}
                  username={accountUsername}
                  password={accountPassword}
                  confirmPassword={accountConfirmPassword}
                  onUsernameChange={setAccountUsername}
                  onPasswordChange={setAccountPassword}
                  onConfirmPasswordChange={setAccountConfirmPassword}
                  onGeneratePassword={handleGeneratePassword}
                />
              </section>

              <section className={step === 5 ? "block" : "hidden"}>
                <StepPreview preview={preview} />
              </section>

              <FormActionsDesktop
                step={step}
                isPending={isPending}
                onBack={handleBack}
                onNext={handleNext}
              />

              <FormActionsMobile
                step={step}
                isPending={isPending}
                onBack={handleBack}
                onNext={handleNext}
              />
            </form>
          </div>
        </section>

        <NewTenantGuidance
          step={step}
          selectedUnit={selectedUnit}
          currencyCode={currencyCode}
        />
      </div>
    </div>
  );
}