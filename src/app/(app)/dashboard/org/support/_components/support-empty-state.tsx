import { MessageSquarePlus } from "lucide-react";

export function SupportEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-5 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
        <MessageSquarePlus className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">No messages sent yet</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Use the form to contact platform administrators about billing, access, or
        technical issues.
      </p>
    </div>
  );
}