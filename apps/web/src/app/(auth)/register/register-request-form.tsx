"use client";

import { useActionState, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { ReferralCodeField } from "@/components/marketing/referral-code-field";
import { createOnboardingRequestAction, type OnboardingRequestState } from "./actions";

const initialState: OnboardingRequestState = {};
export function RegisterRequestForm({ referralCode }: { referralCode: string }) {
  const [state, formAction, pending] = useActionState(createOnboardingRequestAction, initialState);
  const [accountType, setAccountType] = useState("PROPERTY_MANAGER");
  return <div><p className="mb-4 text-sm text-muted-foreground">This is an access request. Our team will review it and contact you to arrange your workspace and sign-in details.</p>
            <form action={formAction} onReset={(event) => event.preventDefault()} onSubmit={(event) => { if (pending) event.preventDefault(); }} className="space-y-3">
              <div className="hidden" aria-hidden="true">
                <label>
                  Website
                  <input
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
              </div>

              <fieldset className="space-y-2"><legend className="text-sm font-semibold">Choose your account type</legend>
                <div className="grid grid-cols-2 gap-3">{[{value: "PROPERTY_MANAGER", label: "Agency", detail: "Manage clients’ properties"}, {value: "LANDLORD", label: "Landlord", detail: "Manage your own properties"}].map((option) => <label key={option.value} className={`cursor-pointer rounded-xl border p-3 ${accountType === option.value ? "border-primary bg-primary/5" : "border-border"}`}><input type="radio" name="accountType" value={option.value} checked={accountType === option.value} onChange={() => setAccountType(option.value)} className="mr-2" /><span className="text-sm font-semibold">{option.label}</span><span className="mt-1 block text-xs text-muted-foreground">{option.detail}</span></label>)}</div>
              </fieldset>
              {state.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950 dark:text-red-200"><p>{state.error}</p>{state.fieldErrors && <ul className="mt-2 list-disc pl-4">{Object.values(state.fieldErrors).flatMap((errors) => errors ?? []).map((error, index) => <li key={index}>{error}</li>)}</ul>}</div>}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name">
                  <input
                    name="fullName"
                    aria-invalid={Boolean(state.fieldErrors?.fullName)}
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                    placeholder="Jane Wanjiku"
                  />
                </Field>

                <Field label={accountType === "LANDLORD" ? "Your name or portfolio name" : "Agency name"}>
                  <input
                    name="companyName"
                    aria-invalid={Boolean(state.fieldErrors?.companyName)}
                    type="text"
                    required
                    minLength={2}
                    maxLength={160}
                    autoComplete="organization"
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                    placeholder={accountType === "LANDLORD" ? "Jane Wanjiku Properties" : "Acme Properties"}
                  />
                </Field>
              </div>

              <Field label="Email address">
                <input
                  name="workEmail"
                    aria-invalid={Boolean(state.fieldErrors?.workEmail)}
                  type="email"
                  required
                  maxLength={160}
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                  placeholder="name@company.com"
                />
              </Field>

              <Field label="Phone number (optional)">
                <input
                  name="phone"
                    aria-invalid={Boolean(state.fieldErrors?.phone)}
                  type="tel"
                  maxLength={40}
                  autoComplete="tel"
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                  placeholder="+254 700 000 000"
                />
              </Field>

              <ReferralCodeField defaultCode={referralCode} />

              <Field label="What do you manage?">
                <select
                  name="managedPropertyType"
                    aria-invalid={Boolean(state.fieldErrors?.managedPropertyType)}
                  required
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                >
                  <option value="Residential properties">Residential properties</option>
                  <option value="Commercial properties">Commercial properties</option>
                  <option value="Mixed-use properties">Mixed-use properties</option>
                  <option value="Warehouses / godowns">Warehouses / godowns</option>
                  <option value="Multiple property types">Multiple property types</option>
                </select>
              </Field>

              <Field label="Tell us about your portfolio (optional)">
                <textarea
                  name="message"
                    aria-invalid={Boolean(state.fieldErrors?.message)}
                  rows={4}
                  maxLength={1200}
                  className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                  placeholder="Number of units, team size, billing pain points, or rollout timeline"
                />
              </Field>

              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {pending ? "Submitting…" : "Submit access request"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-neutral-700 dark:text-slate-200">{label}</span>{children}</label>;
}
