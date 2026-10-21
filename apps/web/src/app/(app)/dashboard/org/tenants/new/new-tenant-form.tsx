"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createTenantAction } from "@/features/tenants/actions/create-tenant-action";
import { FormActions } from "./_components/form-actions";
import { NewTenantGuidance } from "./_components/new-tenant-guidance";
import { NewTenantHeader } from "./_components/new-tenant-header";
import { TenantRegistrationTypeChoice } from "./_components/tenant-registration-type-choice";
import { StepAccountDetails } from "./_components/step-account-details";
import { StepNextOfKin } from "./_components/step-next-of-kin";
import { StepPreview } from "./_components/step-preview";
import { StepTenantDetails } from "./_components/step-tenant-details";
import { TenantStepProgress } from "./_components/tenant-step-progress";
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
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const initialStep = useRef(true);

  const [state, formAction, isPending] = useActionState(
    createTenantAction,
    initialCreateTenantActionState,
  );

  const [step, setStep] = useState<Step>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [existingLease, setExistingLease] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [accountUsername, setAccountUsername] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountConfirmPassword, setAccountConfirmPassword] = useState("");

  const selectedUnit = useMemo(
    () => availableUnits.find((unit) => unit.id === selectedUnitId) ?? null,
    [availableUnits, selectedUnitId],
  );

  useEffect(() => {
    if (initialStep.current) { initialStep.current = false; return; }
    stepHeadingRef.current?.focus({ preventScroll: true });
    stepHeadingRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }, [step]);

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
    // React may reuse this button as the final submit button after advancing.
    // Cancel the original click's default action so Review cannot submit it.
    event.preventDefault();
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
  }

  function handleBack() {
    if (isPending) return;
    setStep((current) => getPreviousStep(current));
    setStepError(null);
  }

  if (state.status === "success" && state.credentials) {
    return <TenantSuccessView state={state} />;
  }

  return (
    <div className="org-theme-content mx-auto w-full max-w-6xl space-y-5 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <NewTenantHeader
        orgName={orgName}
        availableUnitsCount={availableUnits.length}
      />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className={panelShellClassName}>
          <TenantStepProgress step={step} />

          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Step {step} of 5</p><h2 ref={stepHeadingRef} tabIndex={-1} className="mt-1 scroll-mt-28 text-xl font-semibold tracking-tight outline-none">{stepItems[step - 1].title}</h2><p className="mt-1 text-sm text-muted-foreground">{stepItems[step - 1].description}</p></div>
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
              onSubmit={(event) => {
                event.preventDefault();
                if (isPending || step !== 5) return;
                // Capture all steps before pending disables their inputs. Dispatch
                // manually so an error response does not reset uncontrolled fields.
                const data = new FormData(event.currentTarget);
                startTransition(() => formAction(data));
              }}
              className="space-y-6 min-w-0"
            >
              <input type="hidden" name="unitId" value={selectedUnitId} />
              {existingLease ? <input type="hidden" name="existingLease" value="on" /> : null}

              <section className={step === 1 ? "block" : "hidden"}>
                <TenantRegistrationTypeChoice
                  value={existingLease}
                  disabled={isPending}
                  onChange={(value) => {
                    setExistingLease(value);
                    setStepError(null);
                  }}
                />
                <StepTenantDetails isPending={isPending} />
              </section>

              <section className={step === 2 ? "block" : "hidden"}>
                <StepNextOfKin isPending={isPending} />
              </section>

              <section className={step === 3 ? "block" : "hidden"}>
                <StepUnitLease
                  existingLease={existingLease}
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
                <StepPreview preview={preview} currencyCode={currencyCode} />
              </section>

              <FormActions
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
