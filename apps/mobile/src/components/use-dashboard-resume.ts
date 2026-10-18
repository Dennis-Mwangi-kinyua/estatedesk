import { useEffect, useRef } from "react";
import { AppState } from "react-native";

/** Revalidate after a meaningful absence, without background polling. */
export function useDashboardResume(refresh: () => void, enabled = true) {
  const callback = useRef(refresh);
  useEffect(() => { callback.current = refresh; }, [refresh]);
  useEffect(() => {
    if (!enabled) return;
    let pausedAt: number | null = null;
    const subscription = AppState.addEventListener("change", state => {
      if (state !== "active") pausedAt ??= Date.now();
      else if (pausedAt !== null) {
        const elapsed = Date.now() - pausedAt;
        pausedAt = null;
        if (elapsed >= 30_000) callback.current();
      }
    });
    return () => subscription.remove();
  }, [enabled]);
}
