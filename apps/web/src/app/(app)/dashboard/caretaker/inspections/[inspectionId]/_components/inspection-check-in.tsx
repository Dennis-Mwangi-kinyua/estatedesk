"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

type CheckInState = {
  latitude: string;
  longitude: string;
  capturedAt: string;
  status: "idle" | "capturing" | "ready" | "error";
  message: string;
};

function initialCheckInState(): CheckInState {
  if (typeof window !== "undefined" && !navigator.geolocation) {
    return {
      latitude: "",
      longitude: "",
      capturedAt: "",
      status: "error",
      message:
        "GPS is unavailable on this device. You can still submit the report.",
    };
  }

  return {
    latitude: "",
    longitude: "",
    capturedAt: "",
    status: "idle",
    message: "Capture on-site check-in before submitting the report.",
  };
}

export function InspectionCheckIn() {
  const [state, setState] = useState<CheckInState>(initialCheckInState);

  function captureLocation() {
    if (!navigator.geolocation) {
      setState((current) => ({
        ...current,
        status: "error",
        message:
          "GPS is unavailable on this device. You can still submit the report.",
      }));
      return;
    }

    setState((current) => ({
      ...current,
      status: "capturing",
      message: "Capturing GPS coordinates…",
    }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          capturedAt: new Date().toISOString(),
          status: "ready",
          message: "On-site check-in captured.",
        });
      },
      () => {
        setState((current) => ({
          ...current,
          status: "error",
          message:
            "Could not capture GPS. Allow location access or continue without check-in.",
        }));
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <section
      className="rounded-2xl border border-border bg-muted/10 p-4"
      aria-labelledby="inspection-check-in-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            id="inspection-check-in-title"
            className="text-sm font-semibold text-foreground"
          >
            On-site check-in
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {state.message}
          </p>
        </div>
        <button
          type="button"
          onClick={captureLocation}
          disabled={state.status === "capturing"}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/30 disabled:opacity-60"
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {state.status === "capturing" ? "Capturing…" : "Capture location"}
        </button>
      </div>

      <input type="hidden" name="checkInLatitude" value={state.latitude} />
      <input type="hidden" name="checkInLongitude" value={state.longitude} />
      <input type="hidden" name="checkInCapturedAt" value={state.capturedAt} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="check-in-photo"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Arrival photo (optional)
          </label>
          <input
            id="check-in-photo"
            name="checkInPhoto"
            type="file"
            accept="image/*"
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground"
          />
        </div>
        {state.status === "ready" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-3 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
            Lat {state.latitude}, Lng {state.longitude}
          </div>
        ) : null}
      </div>
    </section>
  );
}
