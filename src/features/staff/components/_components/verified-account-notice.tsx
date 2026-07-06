"use client";

import { memo } from "react";

export const VerifiedAccountNotice = memo(function VerifiedAccountNotice() {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <p className="text-sm font-semibold text-foreground">
        Verified staff account
      </p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        This staff member will be created with a verified username, verified
        email, secure password, and the selected staff role.
      </p>
    </div>
  );
});