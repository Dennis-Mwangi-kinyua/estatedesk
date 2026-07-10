export function NoProfileState() {
  return (
    <div className="ed-theme-page ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden bg-background p-3 text-foreground sm:p-4">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        No active landlord profile is linked to this account.
      </div>
    </div>
  );
}