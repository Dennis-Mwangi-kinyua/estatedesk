"use client";

import { useActionState, type ReactNode } from "react";
import { createPlatformUserAction, type CreatePlatformUserResult } from "../../actions";
import { AccountCreatedShare } from "@/components/shared/account-created-share";

export function PlatformUserCreationForm({ children }: { children: ReactNode }) {
  const [state, action] = useActionState<CreatePlatformUserResult, FormData>(async (_previous, data) => createPlatformUserAction(data), {});
  if (state.credentials) return <AccountCreatedShare credentials={state.credentials} continueHref="/platform/users" continueLabel="Go to users" />;
  return <form action={action} className="space-y-5">{children}</form>;
}
