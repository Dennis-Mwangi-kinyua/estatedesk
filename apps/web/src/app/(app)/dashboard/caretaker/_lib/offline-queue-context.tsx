"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { OfflineQueueScope } from "./offline-payload";
const Context = createContext<OfflineQueueScope | null>(null);
export function OfflineQueueProvider({ scope, children }: { scope: OfflineQueueScope; children: ReactNode }) {
  return <Context.Provider value={scope}>{children}</Context.Provider>;
}
export function useOfflineQueueScope() {
  const scope = useContext(Context);
  if (!scope) throw new Error("Offline drafts require a signed-in caretaker workspace.");
  return scope;
}
