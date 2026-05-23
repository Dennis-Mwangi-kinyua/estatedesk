"use client";

import { memo, useCallback, useMemo, useState, useTransition } from "react";
import {
  archiveTenantAction,
  blacklistTenantAction,
  reactivateTenantAction,
  restoreTenantAction,
  softDeleteTenantAction,
  unlinkTenantFromUnitAction,
} from "./tenant-admin-actions";

type AdminActionKey =
  | "unlink"
  | "blacklist"
  | "archive"
  | "delete"
  | "reactivate"
  | "restore";

type TenantAdminActionsProps = {
  tenantId: string;
  hasActiveLease: boolean;
  isDeleted: boolean;
  isBlacklisted: boolean;
  isArchived: boolean;
};

type ActionConfig = {
  key: AdminActionKey;
  label: string;
  title: string;
  description: string;
  placeholder: string;
  confirmLabel: string;
  tone: "default" | "warning" | "danger" | "success";
  run: (formData: FormData) => Promise<void>;
  requireReason?: boolean;
};

const toneClasses = {
  default: {
    badge: "bg-neutral-100 text-neutral-700 border-neutral-200",
    button: "bg-neutral-900 text-white hover:bg-neutral-800",
  },
  warning: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    button: "bg-amber-600 text-white hover:bg-amber-700",
  },
  danger: {
    badge: "bg-red-50 text-red-700 border-red-200",
    button: "bg-red-600 text-white hover:bg-red-700",
  },
  success: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    button: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
} as const;

const ActionDialog = memo(function ActionDialog({
  open,
  onClose,
  action,
  tenantId,
}: {
  open: boolean;
  onClose: () => void;
  action: ActionConfig | undefined;
  tenantId: string;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = useCallback(() => {
    if (!action) return;

    const trimmedReason = reason.trim();

    if (action.requireReason && !trimmedReason) {
      setError("Please provide a reason before continuing.");
      return;
    }

    setError(null);

    const formData = new FormData();
    formData.set("tenantId", tenantId);
    formData.set("reason", trimmedReason);

    startTransition(async () => {
      try {
        await action.run(formData);
        setReason("");
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed. Please try again.");
      }
    });
  }, [action, onClose, reason, tenantId]);

  if (!open || !action) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses[action.tone].badge}`}
            >
              {action.label}
            </span>

            <h4 className="mt-3 text-lg font-semibold text-neutral-950">{action.title}</h4>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{action.description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="mt-5">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Reason / message
          </label>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder={action.placeholder}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
          />

          {error ? (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold ${toneClasses[action.tone].button} disabled:opacity-50`}
            >
              {isPending ? "Processing..." : action.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export const TenantAdminActions = memo(function TenantAdminActions({
  tenantId,
  hasActiveLease,
  isDeleted,
  isBlacklisted,
  isArchived,
}: TenantAdminActionsProps) {
  const [selectedKey, setSelectedKey] = useState("");
  const [open, setOpen] = useState(false);

  const actions = useMemo<ActionConfig[]>(() => {
    const list: ActionConfig[] = [];

    if (!isDeleted && hasActiveLease) {
      list.push({
        key: "unlink",
        label: "Unlink tenant",
        title: "Unlink tenant from unit",
        description:
          "This removes the tenant from the current linked unit or lease relationship. A reason is required.",
        placeholder: "Why are you unlinking this tenant from the unit?",
        confirmLabel: "Confirm unlink",
        tone: "warning",
        run: unlinkTenantFromUnitAction,
        requireReason: true,
      });
    }

    if (!isDeleted && !isBlacklisted) {
      list.push({
        key: "blacklist",
        label: "Blacklist tenant",
        title: "Blacklist tenant",
        description:
          "Use this only for serious administrative or compliance reasons. A reason is required.",
        placeholder: "Provide the reason for blacklisting this tenant",
        confirmLabel: "Confirm blacklist",
        tone: "danger",
        run: blacklistTenantAction,
        requireReason: true,
      });
    }

    if (!isDeleted && !isArchived) {
      list.push({
        key: "archive",
        label: "Archive tenant",
        title: "Archive tenant record",
        description:
          "Archived records remain in the system but are treated as inactive. You can reactivate later if needed.",
        placeholder: "Optional note for archiving this tenant",
        confirmLabel: "Archive tenant",
        tone: "default",
        run: archiveTenantAction,
      });
    }

    if (!isDeleted) {
      list.push({
        key: "delete",
        label: "Soft delete tenant",
        title: "Soft delete tenant profile",
        description:
          "This hides the tenant profile from normal workflows. Active lease links should be handled before deletion.",
        placeholder: "State the reason for deleting this tenant profile",
        confirmLabel: "Delete tenant",
        tone: "danger",
        run: softDeleteTenantAction,
        requireReason: true,
      });
    }

    if (!isDeleted && isArchived) {
      list.push({
        key: "reactivate",
        label: "Reactivate tenant",
        title: "Reactivate tenant",
        description: "This will return the tenant to an active operational state.",
        placeholder: "Optional note for reactivating this tenant",
        confirmLabel: "Reactivate tenant",
        tone: "success",
        run: reactivateTenantAction,
      });
    }

    if (isDeleted) {
      list.push({
        key: "restore",
        label: "Restore tenant",
        title: "Restore deleted tenant",
        description: "This restores the deleted tenant profile back into active records.",
        placeholder: "Optional note for restoring this tenant",
        confirmLabel: "Restore tenant",
        tone: "success",
        run: restoreTenantAction,
      });
    }

    return list;
  }, [hasActiveLease, isArchived, isBlacklisted, isDeleted]);

  const activeAction = useMemo(
    () => actions.find((item) => item.key === selectedKey),
    [actions, selectedKey],
  );

  const handleSelect = useCallback((value: string) => {
    setSelectedKey(value);
    if (value) setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setSelectedKey("");
  }, []);

  return (
    <>
      <div className="rounded-[24px] border border-black/5 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-950">Administrative actions</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Select an action from the dropdown to continue.
            </p>
          </div>

          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
            Secure
          </span>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Choose action
          </label>

          <select
            value={selectedKey}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
          >
            <option value="">Select administrative action</option>
            {actions.map((action) => (
              <option key={action.key} value={action.key}>
                {action.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ActionDialog open={open} onClose={closeDialog} action={activeAction} tenantId={tenantId} />
    </>
  );
});