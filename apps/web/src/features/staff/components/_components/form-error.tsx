"use client";

import { memo } from "react";

export const FormError = memo(function FormError({
  message,
}: {
  message?: string;
}) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-900">Could not continue</p>
      <p className="mt-1 text-sm leading-6 text-red-700">{message}</p>
    </div>
  );
});