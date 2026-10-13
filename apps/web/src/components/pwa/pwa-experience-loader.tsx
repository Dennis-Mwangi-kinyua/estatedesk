"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { isStandaloneDisplayMode } from "@/lib/pwa/client";

const StandalonePwaExperience = dynamic(
  () => import("./pwa-experience").then((module) => module.PwaExperience),
  { ssr: false },
);

function subscribeToDisplayMode(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getDisplayModeSnapshot() {
  return isStandaloneDisplayMode();
}

function getServerDisplayModeSnapshot() {
  return false;
}

/** Keep installed-app controls out of the browser's initial client bundle. */
export function PwaExperienceLoader() {
  const isStandalone = useSyncExternalStore(
    subscribeToDisplayMode,
    getDisplayModeSnapshot,
    getServerDisplayModeSnapshot,
  );

  return isStandalone ? <StandalonePwaExperience /> : null;
}
