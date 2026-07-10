export function FlashMessages({
  successMessage,
  errorMessage,
}: {
  successMessage: string | null;
  errorMessage: string | null;
}) {
  return (
    <>
      {successMessage ? (
        <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </>
  );
}