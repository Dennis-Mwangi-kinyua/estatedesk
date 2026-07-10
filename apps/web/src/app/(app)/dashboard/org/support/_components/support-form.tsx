"use client";

import { useActionState } from "react";
import {
  sendPlatformMessageAction,
  type PlatformMessageState,
} from "../actions";
import {
  buttonPrimaryClassName,
  fieldClassName,
  labelClassName,
} from "../_lib/helpers";
import { panelShellClassName } from "./support-ui";

const initialState: PlatformMessageState = { ok: false };

export function SupportForm() {
  const [state, action, pending] = useActionState(
    sendPlatformMessageAction,
    initialState,
  );

  return (
    <section className={`${panelShellClassName} p-5 sm:p-6`}>
      <h2 className="text-lg font-semibold text-foreground">Send a message</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Platform administrators review billing, access, and technical requests from
        this queue.
      </p>

      <form action={action} className="mt-5 space-y-4">
        {state.message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              state.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <label className={labelClassName}>
          Subject
          <input
            name="subject"
            maxLength={120}
            className={fieldClassName}
            placeholder="Billing, account, technical issue..."
          />
        </label>

        <label className={labelClassName}>
          Message
          <textarea
            name="message"
            rows={7}
            maxLength={2000}
            className={fieldClassName}
            placeholder="Tell the platform team what you need help with."
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className={buttonPrimaryClassName}
        >
          {pending ? "Sending..." : "Send message"}
        </button>
      </form>
    </section>
  );
}