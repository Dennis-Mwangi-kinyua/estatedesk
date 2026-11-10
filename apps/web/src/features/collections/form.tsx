"use client";
import { useActionState, type ReactNode } from "react";
import { collectionAction, type CollectionState } from "./actions";
export function CollectionForm({ children, operation, label }: {children:ReactNode;operation:string;label:string}) {
  const [state,action,pending]=useActionState(collectionAction,{} as CollectionState);
  return <form action={action} className="space-y-3"><input type="hidden" name="operation" value={operation}/><fieldset disabled={pending} className="space-y-3">{children}<button className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto">{pending?"Saving…":label}</button></fieldset>{state.error&&<p role="alert" className="text-sm text-destructive">{state.error}</p>}{state.message&&<p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{state.message}</p>}</form>;
}
