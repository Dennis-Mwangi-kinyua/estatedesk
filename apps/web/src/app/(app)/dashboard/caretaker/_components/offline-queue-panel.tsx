"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { CaretakerI18nFormat } from "./caretaker-i18n-format";
import { CaretakerI18nLabel } from "./caretaker-i18n-label";
import { clearOfflinePhotoForItem } from "../_lib/offline-form";
import { offlinePhotoToPayload } from "../_lib/offline-photo-store";
import { syncOfflineQueueAction } from "../_lib/sync-offline-queue-action";
import {
  clearOfflineQueue,
  getOfflineQueueItems,
  removeOfflineQueueItem,
  type OfflineQueueItem,
} from "../_lib/offline-queue";

async function prepareItemsForSync(items: OfflineQueueItem[]) {
  return Promise.all(
    items.map(async (item) => {
      if (!item.photoKey) {
        return item;
      }

      const photoPayload = await offlinePhotoToPayload(item.photoKey);
      return {
        ...item,
        photoPayload: photoPayload ?? undefined,
      };
    }),
  );
}

export function OfflineQueuePanel({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<OfflineQueueItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    setItems(getOfflineQueueItems());
  }, []);

  const runSync = useCallback(
    (queueItems: OfflineQueueItem[]) => {
      if (!navigator.onLine || queueItems.length === 0) return;

      startTransition(async () => {
        const preparedItems = await prepareItemsForSync(queueItems);
        const result = await syncOfflineQueueAction(preparedItems);

        for (const id of result.syncedIds) {
          const item = queueItems.find((entry) => entry.id === id);
          await clearOfflinePhotoForItem(item?.photoKey);
          removeOfflineQueueItem(id);
        }

        refresh();

        if (result.errors.length > 0) {
          setMessage(
            `Synced ${result.syncedIds.length}. ${result.errors.length} item(s) still need attention.`,
          );
        } else {
          setMessage(`Synced ${result.syncedIds.length} queued item(s).`);
        }
      });
    },
    [refresh],
  );

  useEffect(() => {
    refresh();

    function handleChange() {
      refresh();
    }

    function handleOnline() {
      refresh();
      const queued = getOfflineQueueItems();
      if (queued.length > 0) {
        runSync(queued);
      }
    }

    function handleServiceWorkerMessage(event: MessageEvent) {
      if (event.data?.type === "SYNC_CARETAKER_OFFLINE_QUEUE") {
        const queued = getOfflineQueueItems();
        runSync(queued);
      }
    }

    window.addEventListener("caretaker-offline-queue-change", handleChange);
    window.addEventListener("online", handleOnline);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    }
    return () => {
      window.removeEventListener("caretaker-offline-queue-change", handleChange);
      window.removeEventListener("online", handleOnline);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "message",
          handleServiceWorkerMessage,
        );
      }
    };
  }, [refresh, runSync]);

  function handleSync() {
    runSync(items);
  }

  if (compact) {
    if (items.length === 0) return null;

    return (
      <button
        type="button"
        onClick={handleSync}
        disabled={!navigator.onLine || isPending}
        className="ios-button ed-soft-button relative inline-flex h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-semibold shadow-sm"
        aria-label="Sync offline queue"
        title="Sync offline queue"
      >
        <CloudOff className="h-4 w-4" aria-hidden="true" />
        <span aria-hidden="true">{items.length}</span>
      </button>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground"
        role="status"
      >
        <CaretakerI18nLabel labelKey="offlineQueueEmpty" />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-500/10"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            <CaretakerI18nFormat
              labelKey="offlineQueueWaiting"
              values={{ count: items.length }}
            />
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            <CaretakerI18nLabel labelKey="offlineQueueHint" />
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={!navigator.onLine || isPending}
          aria-label="Sync offline queue now"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <CaretakerI18nLabel labelKey="syncNow" />
        </button>
      </div>

      <ul className="mt-3 space-y-2 text-xs text-muted-foreground" aria-label="Queued offline items">
        {items.slice(0, 5).map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-background px-3 py-2">
            {item.kind === "meter_reading"
              ? `Meter reading · ${item.period}${item.photoKey ? " · photo" : ""}`
              : item.kind === "inspection"
                ? `Inspection · ${(item.notes || "log").slice(0, 40)}${item.photoKey ? " · photo" : ""}`
                : `Issue · ${item.title}${item.photoKey ? " · photo" : ""}`}
          </li>
        ))}
      </ul>

      {message ? (
        <p className="mt-3 text-xs text-foreground" role="status">
          {message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => {
          clearOfflineQueue();
          refresh();
          setMessage(null);
        }}
        className="mt-3 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
      >
        <CaretakerI18nLabel labelKey="clearQueue" />
      </button>
    </div>
  );
}