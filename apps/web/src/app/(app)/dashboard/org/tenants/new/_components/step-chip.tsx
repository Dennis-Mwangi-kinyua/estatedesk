"use client";

import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import { Check } from "lucide-react";
import type { StepItem } from "../_lib/types";
const stepIcons = ["profile", "contact", "units", "password", "review"];
export function StepChip({ item, active, complete }: { item: StepItem; active: boolean; complete: boolean }) {
  return <li aria-current={active ? "step" : undefined} aria-label={`Step ${item.id}: ${item.title}${complete ? ", completed" : ""}`} className={`flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-3 text-center ${active ? "bg-primary/5" : ""}`}>
    <span aria-hidden="true" className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg sm:h-11 sm:w-11 ${active ? "border-primary/30 bg-background shadow-sm ring-2 ring-primary/10" : complete ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border bg-background"}`}>{complete ? <Check className="h-5 w-5" /> : <WorkspaceIcon label={stepIcons[item.id-1]} />}</span>
    <span className={`hidden text-xs font-medium sm:block ${active ? "text-primary" : "text-muted-foreground"}`}>{item.title}</span>
    <span aria-hidden="true" className={`text-[10px] font-semibold sm:hidden ${active ? "text-primary" : "text-muted-foreground"}`}>{item.id}</span>
  </li>;
}
