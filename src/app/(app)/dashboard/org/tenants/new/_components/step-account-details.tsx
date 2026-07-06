"use client";

import type { ChangeEvent } from "react";
import {
  buttonSecondaryClassName,
  inputClassName,
  stepPanelClassName,
} from "../_lib/constants";
import { FieldLabel, SectionTitle } from "./ui-primitives";

type StepAccountDetailsProps = {
  isPending: boolean;
  username: string;
  password: string;
  confirmPassword: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onGeneratePassword: () => void;
};

export function StepAccountDetails({
  isPending,
  username,
  password,
  confirmPassword,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onGeneratePassword,
}: StepAccountDetailsProps) {
  function handleUsernameChange(event: ChangeEvent<HTMLInputElement>) {
    onUsernameChange(event.target.value);
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    onPasswordChange(event.target.value);
  }

  function handleConfirmPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    onConfirmPasswordChange(event.target.value);
  }

  return (
    <div className={stepPanelClassName}>
      <SectionTitle
        title="Login account"
        description="Set the username and password the tenant will use to sign in."
      />

      <div className="mt-5 space-y-4">
        <label className="block">
          <FieldLabel required>Username</FieldLabel>
          <input
            name="username"
            type="text"
            value={username}
            onChange={handleUsernameChange}
            maxLength={30}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="janewanjiku"
            enterKeyHint="next"
            className={inputClassName}
            disabled={isPending}
          />
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            3–30 characters. Letters, numbers, dots, underscores, and hyphens only.
          </p>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <FieldLabel required>Password</FieldLabel>
            <input
              name="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              enterKeyHint="next"
              className={inputClassName}
              disabled={isPending}
            />
          </label>

          <label className="block">
            <FieldLabel required>Confirm password</FieldLabel>
            <input
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              minLength={8}
              autoComplete="new-password"
              placeholder="Repeat password"
              enterKeyHint="done"
              className={inputClassName}
              disabled={isPending}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onGeneratePassword}
          disabled={isPending}
          className={buttonSecondaryClassName}
        >
          Generate secure password
        </button>

        <div className="rounded-2xl border border-border bg-muted/15 px-4 py-3 text-sm leading-6 text-muted-foreground">
          A verified login account will be created together with the tenant profile.
          The tenant must change this password on first sign-in.
        </div>
      </div>
    </div>
  );
}