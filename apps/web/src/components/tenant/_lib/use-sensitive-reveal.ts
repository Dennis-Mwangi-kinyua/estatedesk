"use client";

import { useCallback, useState } from "react";
import { verifyTenantPassword } from "@/app/(app)/dashboard/tenant/profile/actions";
import { FIELD_LABELS, INITIAL_REVEAL_STATE } from "./helpers";
import type { RevealState, SensitiveFieldKey } from "./types";

export function useSensitiveReveal() {
  const [revealed, setRevealed] = useState<RevealState>(INITIAL_REVEAL_STATE);
  const [activeField, setActiveField] = useState<SensitiveFieldKey | null>(null);
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeFieldLabel = activeField
    ? FIELD_LABELS[activeField]
    : "this field";

  const closeModal = useCallback(() => {
    setActiveField(null);
    setPassword("");
    setSubmitError(null);
    setIsSubmitting(false);
  }, []);

  const handleRequestReveal = useCallback((field: SensitiveFieldKey) => {
    setSubmitError(null);

    setRevealed((prev) => {
      if (prev[field]) {
        setActiveField(null);
        return {
          ...prev,
          [field]: false,
        };
      }

      setActiveField(field);
      return prev;
    });

    setPassword("");
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
  }, []);

  const handleConfirmReveal = useCallback(async () => {
    if (!activeField) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const result = await verifyTenantPassword(password);

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }

      setRevealed((prev) => ({
        ...prev,
        [activeField]: true,
      }));

      closeModal();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [activeField, closeModal, password]);

  return {
    revealed,
    activeField,
    password,
    submitError,
    isSubmitting,
    activeFieldLabel,
    closeModal,
    handleRequestReveal,
    handlePasswordChange,
    handleConfirmReveal,
  };
}