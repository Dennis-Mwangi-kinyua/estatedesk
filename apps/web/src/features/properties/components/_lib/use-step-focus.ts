"use client";

import { useEffect, type RefObject } from "react";

export function useStepFocus(step: number, formRef: RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    if (step === 1) return;
    const heading = formRef.current?.querySelector<HTMLElement>("div.block h2");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    formRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
  }, [step, formRef]);
}
