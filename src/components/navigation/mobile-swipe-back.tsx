"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const EDGE_WIDTH = 28;
const MIN_SWIPE_DISTANCE = 86;
const MAX_VERTICAL_DRIFT = 72;
const MAX_DURATION_MS = 650;

function isInteractiveElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest(
      [
        "a",
        "button",
        "input",
        "textarea",
        "select",
        "summary",
        "[role='button']",
        "[role='tab']",
        "[data-swipe-back='ignore']",
      ].join(","),
    ),
  );
}

export function MobileSwipeBack() {
  const router = useRouter();
  const start = useRef<{
    x: number;
    y: number;
    time: number;
    active: boolean;
  } | null>(null);

  useEffect(() => {
    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1 || isInteractiveElement(event.target)) {
        start.current = null;
        return;
      }

      const touch = event.touches[0];
      start.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: window.performance.now(),
        active: touch.clientX <= EDGE_WIDTH,
      };
    }

    function handleTouchMove(event: TouchEvent) {
      const gesture = start.current;
      if (!gesture?.active || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - gesture.x;
      const deltaY = Math.abs(touch.clientY - gesture.y);

      if (deltaX < -12 || deltaY > MAX_VERTICAL_DRIFT) {
        gesture.active = false;
      }
    }

    function handleTouchEnd(event: TouchEvent) {
      const gesture = start.current;
      start.current = null;

      if (!gesture?.active || event.changedTouches.length !== 1) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - gesture.x;
      const deltaY = Math.abs(touch.clientY - gesture.y);
      const duration = window.performance.now() - gesture.time;

      if (
        deltaX >= MIN_SWIPE_DISTANCE &&
        deltaY <= MAX_VERTICAL_DRIFT &&
        duration <= MAX_DURATION_MS &&
        window.history.length > 1
      ) {
        router.back();
      }
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router]);

  return null;
}
