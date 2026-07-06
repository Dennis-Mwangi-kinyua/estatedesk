import { updatePaymentInstructionsAction } from "@/features/settings/actions/settings-actions";
import { buttonPrimaryClassName } from "../../_lib/helpers";
import type { SettingsPageData } from "../../settings-data";
import {
  InputField,
  SectionCard,
  StatusBadge,
  TextAreaField,
  ToggleField,
} from "../../settings-ui";

export function PaymentInstructionsSection({ data }: { data: SettingsPageData }) {
  return (
    <SectionCard
      id="payment-instructions"
      title="Payment Instructions"
      description="Set the M-Pesa and bank details tenants should use for this organization. These details are shown during checkout."
      action={
        <StatusBadge
          label={
            data.paymentInstructions.mpesaEnabled ||
            data.paymentInstructions.bankEnabled
              ? "Configured"
              : "Not configured"
          }
          variant={
            data.paymentInstructions.mpesaEnabled ||
            data.paymentInstructions.bankEnabled
              ? "success"
              : "warning"
          }
        />
      }
    >
      <form action={updatePaymentInstructionsAction} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-slate-900/50 sm:p-4">
          <ToggleField
            label="Enable M-Pesa Instructions"
            description="Show this organization's Paybill or Till details to tenants during checkout."
            name="mpesaEnabled"
            defaultChecked={data.paymentInstructions.mpesaEnabled}
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <InputField
              label="Business Name"
              name="mpesaBusinessName"
              defaultValue={data.paymentInstructions.mpesaBusinessName}
              placeholder="EstateDesk Properties Ltd"
            />
            <InputField
              label="Paybill Number"
              name="mpesaPaybill"
              defaultValue={data.paymentInstructions.mpesaPaybill}
              placeholder="123456"
            />
            <InputField
              label="Till Number"
              name="mpesaTillNumber"
              defaultValue={data.paymentInstructions.mpesaTillNumber}
              placeholder="987654"
            />
            <InputField
              label="Default Account Reference"
              name="mpesaAccountNumber"
              defaultValue={data.paymentInstructions.mpesaAccountNumber}
              placeholder="Use your house number or tenant code"
            />
            <div className="md:col-span-2">
              <TextAreaField
                label="Tenant Instructions"
                name="mpesaInstructions"
                defaultValue={data.paymentInstructions.mpesaInstructions}
                placeholder="Example: Go to M-Pesa, Lipa na M-Pesa, Paybill, enter account as your unit number, then submit the confirmation code in EstateDesk."
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-slate-900/50 sm:p-4">
          <ToggleField
            label="Enable Bank Instructions"
            description="Show this organization's bank account details to tenants during checkout."
            name="bankEnabled"
            defaultChecked={data.paymentInstructions.bankEnabled}
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <InputField
              label="Bank Name"
              name="bankName"
              defaultValue={data.paymentInstructions.bankName}
              placeholder="KCB Bank Kenya"
            />
            <InputField
              label="Account Name"
              name="bankAccountName"
              defaultValue={data.paymentInstructions.bankAccountName}
              placeholder="EstateDesk Properties Ltd"
            />
            <InputField
              label="Account Number"
              name="bankAccountNumber"
              defaultValue={data.paymentInstructions.bankAccountNumber}
              placeholder="1234567890"
            />
            <InputField
              label="Branch"
              name="bankBranch"
              defaultValue={data.paymentInstructions.bankBranch}
              placeholder="Westlands"
            />
            <div className="md:col-span-2">
              <TextAreaField
                label="Tenant Instructions"
                name="bankInstructions"
                defaultValue={data.paymentInstructions.bankInstructions}
                placeholder="Example: Transfer exact amount, use your unit number as reference, then submit the bank confirmation reference in EstateDesk."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className={`w-full sm:w-auto ${buttonPrimaryClassName}`}
          >
            Save Payment Instructions
          </button>
        </div>
      </form>
    </SectionCard>
  );
}