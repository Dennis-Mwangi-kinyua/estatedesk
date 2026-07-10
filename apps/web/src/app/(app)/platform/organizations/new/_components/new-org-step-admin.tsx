import { Lock, Mail, Phone, ShieldCheck, User2 } from "lucide-react";
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

  return (
    <section className={panelClass}>
      <div className="mb-6">
        <div className={iconBubbleClass}>
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h2 className={stepTitleClass}>Organization master login</h2>
        <p className={stepDescriptionClass}>
          Create the organization-level admin account. This login can
          create admins, managers, accountants, caretakers, tenants, and
          landlord mappings inside the workspace.
        </p>
      </div>

      <div className="grid gap-4">
        <Field
          label="Master full name"
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

        <Field
          label="Master username"
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
          <Field
            label="Master email"
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

          <Field
            label="Master phone"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Password"
            required
            error={state.fieldErrors?.adminPassword?.[0]}
          >
            <div className="relative">
              <Lock className={iconClass} />
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={iconFieldClass}
              />
            </div>
          </Field>

          <Field
            label="Confirm password"
            required
            error={state.fieldErrors?.adminPasswordConfirm?.[0]}
          >
            <div className="relative">
              <Lock className={iconClass} />
              <input
                type="password"
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