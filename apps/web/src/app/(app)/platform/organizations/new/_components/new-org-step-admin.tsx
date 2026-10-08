"use client";

import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import { useState } from "react";
import { Lock, Mail, Phone, User2 } from "lucide-react";
import {
  iconBubbleClass,
  iconClass,
  iconFieldClass,
  panelClass,
  stepDescriptionClass,
  stepTitleClass,
} from "../_lib/constants";
import { Field } from "./new-org-ui";
import type { NewOrgFormState } from "./use-new-org-form";

type Props = Pick<
  NewOrgFormState,
  | "state"
  | "adminFullName"
  | "setAdminFullName"
  | "adminUsername"
  | "setAdminUsername"
  | "adminEmail"
  | "setAdminEmail"
  | "adminPhone"
  | "setAdminPhone"
  | "adminPassword"
  | "setAdminPassword"
  | "adminPasswordConfirm"
  | "setAdminPasswordConfirm"
>;

export function NewOrgStepAdmin(props: Props) {
  const {
    state,
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
  } = props;

  const [showPassword, setShowPassword] = useState(false);

  function generatePassword() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    const password = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
    setAdminPassword(password);
    setAdminPasswordConfirm(password);
  }

  return (
    <section className={panelClass}>
      <div className="mb-6">
        <div className={iconBubbleClass}>
          <span aria-hidden="true" className="text-2xl"><WorkspaceIcon label="security" className="inline-block h-5 w-5 shrink-0 align-middle" /></span>
        </div>
        <h2 className={stepTitleClass}>Account owner login</h2>
        <p className={stepDescriptionClass}>
          Set up the owner’s administrator login. They will change their temporary
          password on first sign-in. Download their credentials PDF after creation.
        </p>
      </div>

      <div className="grid gap-4">
        <Field name="adminFullName" label="Full name"
          required
          error={state.fieldErrors?.adminFullName?.[0]}
        >
          <div className="relative">
            <User2 className={iconClass} />
            <input
              value={adminFullName}
              onChange={(e) => setAdminFullName(e.target.value)}
              placeholder="Dennis Mwangi"
              className={iconFieldClass}
            />
          </div>
        </Field>

        <Field name="adminUsername" label="Username"
          required
          error={state.fieldErrors?.adminUsername?.[0]}
        >
          <div className="relative">
            <User2 className={iconClass} />
            <input
              value={adminUsername}
              onChange={(e) =>
                setAdminUsername(
                  e.target.value.toLowerCase().replace(/\s+/g, ""),
                )
              }
              placeholder="greenview-admin"
              className={iconFieldClass}
            />
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="adminEmail" label="Login email"
            required
            error={state.fieldErrors?.adminEmail?.[0]}
          >
            <div className="relative">
              <Mail className={iconClass} />
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@greenview.co.ke"
                className={iconFieldClass}
              />
            </div>
          </Field>

          <Field name="adminPhone" label="Phone (optional)"
            error={state.fieldErrors?.adminPhone?.[0]}
          >
            <div className="relative">
              <Phone className={iconClass} />
              <input
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+254700000001"
                className={iconFieldClass}
              />
            </div>
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
          <button data-workspace-action="true" type="button" onClick={generatePassword} className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold">Generate secure password</button>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Show passwords</label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="adminPassword" label="Temporary password"
            required
            error={state.fieldErrors?.adminPassword?.[0]}
          >
            <div className="relative">
              <Lock className={iconClass} />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={iconFieldClass}
              />
            </div>
          </Field>

          <Field name="adminPasswordConfirm" label="Confirm password"
            required
            error={state.fieldErrors?.adminPasswordConfirm?.[0]}
          >
            <div className="relative">
              <Lock className={iconClass} />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={adminPasswordConfirm}
                onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                placeholder="Repeat password"
                className={iconFieldClass}
              />
            </div>
          </Field>
        </div>
      </div>
    </section>
  );
}