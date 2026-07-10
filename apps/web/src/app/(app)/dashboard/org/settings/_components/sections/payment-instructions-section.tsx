import { updatePaymentInstructionsAction } from "@/features/settings/actions/settings-actions";
import {
  DEFAULT_KCB_PAYBILL,
  getBankAccountForMethod,
  hasAnyPaymentInstructions,
  resolveEnabledMethods,
} from "@/lib/payments/instructions";
import { PAYMENT_METHOD_CATALOG } from "@/lib/payments/methods-catalog";
import { buttonPrimaryClassName } from "../../_lib/helpers";
import type { SettingsPageData } from "../../settings-data";
import {
  InputField,
  SectionCard,
  StatusBadge,
  TextAreaField,
} from "../../settings-ui";

export function PaymentInstructionsSection({ data }: { data: SettingsPageData }) {
  const instructions = data.paymentInstructions;
  const enabled = new Set(resolveEnabledMethods(instructions));
  const configured = hasAnyPaymentInstructions(instructions);

  const mobileMethods = PAYMENT_METHOD_CATALOG.filter(
    (method) => method.type === "mobile_money",
  );
  const bankMethods = PAYMENT_METHOD_CATALOG.filter(
    (method) => method.type === "bank",
  );

  return (
    <SectionCard
      id="payment-instructions"
      title="Payment methods"
      description="Choose which payment methods your tenants can use. Only enabled methods appear on the tenant payment gateway — for example M-Pesa + KCB + Family Bank, while another organization can enable only Co-op and Equity."
      action={
        <StatusBadge
          label={configured ? "Configured" : "Not configured"}
          variant={configured ? "success" : "warning"}
        />
      }
    >
      <form action={updatePaymentInstructionsAction} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-slate-900/50 sm:p-4">
          <p className="text-sm font-semibold text-foreground">Mobile money</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enable only the wallets this organization accepts.
          </p>

          <div className="mt-4 space-y-4">
            {mobileMethods.map((method) => {
              const isOn = enabled.has(method.id);
              return (
                <div
                  key={method.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      name="enabledMethods"
                      value={method.id}
                      defaultChecked={isOn}
                      className="mt-1 h-4 w-4 rounded border-border"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        {method.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {method.description}
                      </span>
                    </span>
                  </label>

                  {method.id === "mpesa" ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <InputField
                        label="Business Name"
                        name="mpesaBusinessName"
                        defaultValue={instructions.mpesaBusinessName}
                        placeholder="EstateDesk Properties Ltd"
                      />
                      <InputField
                        label="Paybill Number"
                        name="mpesaPaybill"
                        defaultValue={instructions.mpesaPaybill}
                        placeholder="123456"
                      />
                      <InputField
                        label="Till Number"
                        name="mpesaTillNumber"
                        defaultValue={instructions.mpesaTillNumber}
                        placeholder="987654"
                      />
                      <InputField
                        label="Default Account Reference"
                        name="mpesaAccountNumber"
                        defaultValue={instructions.mpesaAccountNumber}
                        placeholder="Unit number or tenant code"
                      />
                      <div className="md:col-span-2">
                        <TextAreaField
                          label="Tenant Instructions"
                          name="mpesaInstructions"
                          defaultValue={instructions.mpesaInstructions}
                          placeholder="Example: Lipa na M-Pesa → Paybill → account = unit number → submit code in EstateDesk."
                        />
                      </div>
                    </div>
                  ) : null}

                  {method.id === "airtel-money" ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <InputField
                        label="Business / Display Name"
                        name="airtelBusinessName"
                        defaultValue={instructions.airtelBusinessName}
                        placeholder="EstateDesk Properties"
                      />
                      <InputField
                        label="Airtel Money number / till"
                        name="airtelNumber"
                        defaultValue={instructions.airtelNumber}
                        placeholder="e.g. 07XXXXXXXX or till"
                      />
                      <div className="md:col-span-2">
                        <TextAreaField
                          label="Tenant Instructions"
                          name="airtelInstructions"
                          defaultValue={instructions.airtelInstructions}
                          placeholder="Send rent via Airtel Money to this number, then submit the confirmation code in EstateDesk."
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/30 sm:p-4">
          <p className="text-sm font-semibold text-foreground">KCB paybill</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Lipa na M-Pesa paybill into your KCB account (commonly business number{" "}
            {DEFAULT_KCB_PAYBILL}).
          </p>

          <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-card p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="enabledMethods"
                value="kcb"
                defaultChecked={enabled.has("kcb")}
                className="mt-1 h-4 w-4 rounded border-border"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  KCB Paybill
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Tenants pay via M-Pesa to your KCB paybill, then submit the code.
                </span>
              </span>
            </label>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <InputField
                label="Business / Account Name"
                name="kcbBusinessName"
                defaultValue={instructions.kcbBusinessName}
                placeholder="EstateDesk Properties Ltd"
              />
              <InputField
                label="KCB Paybill Number"
                name="kcbPaybill"
                defaultValue={instructions.kcbPaybill || DEFAULT_KCB_PAYBILL}
                placeholder={DEFAULT_KCB_PAYBILL}
              />
              <InputField
                label="KCB Account Number"
                name="kcbAccountNumber"
                defaultValue={instructions.kcbAccountNumber}
                placeholder="1234567890"
              />
              <InputField
                label="Account Name (on statement)"
                name="kcbAccountName"
                defaultValue={instructions.kcbAccountName}
                placeholder="As it appears on KCB"
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label="Tenant Instructions"
                  name="kcbInstructions"
                  defaultValue={instructions.kcbInstructions}
                  placeholder={`M-Pesa → Lipa na M-Pesa → Paybill ${DEFAULT_KCB_PAYBILL} → account = your KCB account → paste code in EstateDesk.`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-slate-900/50 sm:p-4">
          <p className="text-sm font-semibold text-foreground">Banks</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tick only the banks this organization uses. Each bank can have its own
            account details. Tenants will only see the banks you enable.
          </p>

          <div className="mt-4 space-y-3">
            {bankMethods
              .filter((method) => method.id !== "kcb")
              .map((method) => {
                const isOn = enabled.has(method.id);
                const account =
                  getBankAccountForMethod(instructions, method.id) ??
                  instructions.bankAccounts[method.id];

                return (
                  <div
                    key={method.id}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        name="enabledMethods"
                        value={method.id}
                        defaultChecked={isOn}
                        className="mt-1 h-4 w-4 rounded border-border"
                      />
                      <span>
                        <span className="block text-sm font-medium text-foreground">
                          {method.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {method.description}
                        </span>
                      </span>
                    </label>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <InputField
                        label="Business / Display Name"
                        name={`bank_${method.id}_businessName`}
                        defaultValue={account?.businessName ?? method.name}
                        placeholder={method.name}
                      />
                      <InputField
                        label="Account Name"
                        name={`bank_${method.id}_accountName`}
                        defaultValue={account?.accountName ?? ""}
                        placeholder="Account holder name"
                      />
                      <InputField
                        label="Account Number"
                        name={`bank_${method.id}_accountNumber`}
                        defaultValue={account?.accountNumber ?? ""}
                        placeholder="1234567890"
                      />
                      <InputField
                        label="Branch"
                        name={`bank_${method.id}_branch`}
                        defaultValue={account?.branch ?? ""}
                        placeholder="Branch name"
                      />
                      <div className="md:col-span-2">
                        <TextAreaField
                          label="Tenant Instructions"
                          name={`bank_${method.id}_instructions`}
                          defaultValue={account?.instructions ?? ""}
                          placeholder="Transfer exact amount, use unit number as reference, then submit the bank confirmation in EstateDesk."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className={`w-full sm:w-auto ${buttonPrimaryClassName}`}
          >
            Save payment methods
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
