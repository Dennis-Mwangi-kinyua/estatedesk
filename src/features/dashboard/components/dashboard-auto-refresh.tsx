"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function DashboardAutoRefresh({
  interval = 5000,
}: {
  interval?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, interval);

    return () => clearInterval(id);
  }, [router, interval]);

  return null;
}