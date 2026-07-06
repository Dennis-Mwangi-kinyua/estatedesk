import { isSupportedCurrency } from "@/lib/currencies";
import type { AssignmentTarget, FormValues } from "./types";

function parseSalaryAmount(value: string): number | null {
  const text = value.trim().replace(/,/g, "");

  if (!text) {
    return null;
  }

  const amount = Number(text);
  return Number.isFinite(amount) && amount >= 0 ? amount : Number.NaN;
}

export function validateStaffProfileFields(values: FormValues): string | null {
  if (!values.jobTitle.trim()) {
    return "Job title is required.";
  }

  if (!values.educationLevel.trim()) {
    return "Education level is required.";
  }

  const salary = parseSalaryAmount(values.salaryAmount);

  if (salary === null) {
    return "Salary is required.";
  }

  if (Number.isNaN(salary)) {
    return "Salary must be a valid positive number.";
  }

  if (
    !values.salaryCurrency.trim() ||
    !isSupportedCurrency(values.salaryCurrency)
  ) {
    return "Select a supported currency.";
  }

  if (!values.nationalId.trim()) {
    return "National ID / employee ID is required.";
  }

  if (!values.emergencyContact.trim()) {
    return "Emergency contact is required.";
  }

  if (!values.staffProfileNotes.trim()) {
    return "Staff profile notes are required.";
  }

  return null;
}

export function isStaffCreationFormComplete(
  values: FormValues,
  options?: {
    requireCaretakerTarget?: boolean;
    selectedTarget?: AssignmentTarget | null;
  },
): boolean {
  if (!values.fullName.trim()) {
    return false;
  }

  if (!values.username.trim()) {
    return false;
  }

  if (!/^[a-z0-9._-]{3,30}$/.test(values.username.trim())) {
    return false;
  }

  if (!values.email.trim()) {
    return false;
  }

  if (!values.phone.trim() || values.phone.trim().length < 7) {
    return false;
  }

  if (validateStaffProfileFields(values)) {
    return false;
  }

  if (values.password.length < 8) {
    return false;
  }

  if (values.password !== values.confirmPassword) {
    return false;
  }

  if (options?.requireCaretakerTarget && !options.selectedTarget) {
    return false;
  }

  return true;
}

export function validateCaretakerStep(
  step: number,
  values: FormValues,
  selectedTarget: AssignmentTarget | null,
): string | null {
  if (step === 0 && !selectedTarget) {
    return "Please select a property or apartment/block for this caretaker.";
  }

  if (step === 1) {
    if (!values.fullName.trim()) {
      return "Full name is required.";
    }

    if (!values.username.trim()) {
      return "Username is required.";
    }

    if (!/^[a-z0-9._-]{3,30}$/.test(values.username.trim())) {
      return "Username must be 3-30 characters and can only contain letters, numbers, dots, underscores, and hyphens.";
    }

    if (!values.email.trim()) {
      return "Email is required.";
    }

    if (!values.phone.trim()) {
      return "Phone is required.";
    }

    if (values.phone.trim().length < 7) {
      return "Phone number looks too short.";
    }

    const profileError = validateStaffProfileFields(values);
    if (profileError) {
      return profileError;
    }
  }

  if (step === 2) {
    if (values.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (values.password !== values.confirmPassword) {
      return "Passwords do not match.";
    }
  }

  return null;
}