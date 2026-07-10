"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

type PasswordFieldProps = {
  label: string;
  name: string;
  id?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  shellClassName: string;
  inputClassName?: string;
  labelClassName?: string;
};

const defaultInputClassName =
  "h-full min-w-0 flex-1 bg-transparent text-sm text-slate-950 caret-slate-950 outline-none placeholder:text-slate-400 dark:text-slate-50 dark:caret-slate-50 dark:placeholder:text-slate-500";

const toggleButtonClassName =
  "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200";

export function PasswordField({
  label,
  name,
  id,
  autoComplete,
  required = false,
  minLength,
  placeholder,
  disabled = false,
  icon: Icon,
  shellClassName,
  inputClassName = defaultInputClassName,
  labelClassName = "mb-2 block text-sm font-medium text-slate-900 dark:text-slate-100",
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <label className="block" htmlFor={inputId}>
      <span className={labelClassName}>{label}</span>

      <div className={shellClassName}>
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
        ) : null}

        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClassName}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className={toggleButtonClassName}
          aria-label={visible ? "Hide password" : "View password"}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">
            {visible ? "Hide password" : "View password"}
          </span>
          <span className="sm:hidden">{visible ? "Hide" : "View"}</span>
        </button>
      </div>
    </label>
  );
}