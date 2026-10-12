"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { WorkspaceIcon } from "@/components/shared/workspace-icon";

export function CreateUserSubmit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} data-workspace-action="true" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto">
    {pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <WorkspaceIcon label="add user" className="h-4 w-4" />}
    {pending ? "Creating user…" : "Create platform user"}
  </button>;
}
