"use client";

import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import { User2 } from "lucide-react";
import { Mail, Phone } from "@/components/shared/colored-icons";
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
  | "adminEmail"
  | "setAdminEmail"
  | "adminPhone"
  | "setAdminPhone"
>;

export function NewOrgStepAdmin(props: Props) {
  const {
    state,
    adminFullName,
    setAdminFullName,
    adminUsername,
    adminEmail,
    setAdminEmail,
    adminPhone,
    setAdminPhone,
  } = props;

  return (
    <section className={panelClass}>
      <div className="mb-6">
        <div className={iconBubbleClass}>
          <span aria-hidden="true" className="text-2xl"><WorkspaceIcon label="security" className="inline-block h-5 w-5 shrink-0 align-middle" /></span>
        </div>
        <h2 className={stepTitleClass}>Account owner login</h2>
        <p className={stepDescriptionClass}>
          Set up the owner’s administrator login. EstateDesk will generate a unique
          temporary password, which they must change on first sign-in.
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
              readOnly
              aria-readonly="true"
              placeholder="Set when login email is entered"
              className={iconFieldClass}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">The login username defaults to the account owner’s email address.</p>
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

      </div>
    </section>
  );
}
