"use client";

import { useActionState } from "react";
import {
  sendPlatformMessageAction,
  type PlatformMessageState,
} from "./actions";

const initialState: PlatformMessageState = { ok: false };

export function SupportForm() {
  const [state, action, pending] = useActionState(
    sendPlatformMessageAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-4">
      {state.message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-neutral-700">
          Subject
        </span>
        <input
          name="subject"
          maxLength={120}
          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-400"
          placeholder="Billing, account, technical issue..."
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-neutral-700">
          Message
        </span>
        <textarea
          name="message"
          rows={7}
          maxLength={2000}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-400"
          placeholder="Tell the platform team what you need help with."
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="ios-button inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
