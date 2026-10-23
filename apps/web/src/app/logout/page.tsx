"use client";

import { useEffect } from "react";
import { clearLogoutCacheWithin } from "@/lib/auth/logout-cache";

export default function LogoutPage() {
  useEffect(() => {
    // A document navigation also discards the in-memory Next.js router cache.
    void clearLogoutCacheWithin(window).finally(() => window.location.replace("/login"));
  }, []);

  return <main className="flex min-h-dvh items-center justify-center p-6"><p role="status">Logging out…</p><noscript><a href="/login">Continue to sign in</a></noscript></main>;
}
