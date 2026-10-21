import { focusField } from "./helpers";
import { parseOpeningArrears } from "@/lib/tenants/opening-arrears";

export function validateStepOne(form: HTMLFormElement): string | null {
  const data = new FormData(form);
  const fullName = String(data.get("fullName") ?? "").trim();
  const phone = String(data.get("phone") ?? "").trim();

  if (!fullName) {
    focusField(form, "fullName");
    return "Full name is required.";
  }

  if (!phone) {
    focusField(form, "phone");
    return "Phone is required.";
  }

  return null;
}

export function validateStepTwo(form: HTMLFormElement): string | null {
  const data = new FormData(form);
  const nextOfKinName = String(data.get("nextOfKinName") ?? "").trim();
  const nextOfKinRelationship = String(
    data.get("nextOfKinRelationship") ?? "",
  ).trim();
  const nextOfKinPhone = String(data.get("nextOfKinPhone") ?? "").trim();

  if (!nextOfKinName) {
    focusField(form, "nextOfKinName");
    return "Next of kin name is required.";
  }

  if (!nextOfKinRelationship) {
    focusField(form, "nextOfKinRelationship");
    return "Next of kin relationship is required.";
  }

  if (!nextOfKinPhone) {
    focusField(form, "nextOfKinPhone");
    return "Next of kin phone is required.";
  }

  return null;
}

export function validateStepThree(form: HTMLFormElement): string | null {
  const data = new FormData(form);
  const unitId = String(data.get("unitId") ?? "").trim();
  const dueDayRaw = String(data.get("dueDay") ?? "").trim();
  const status = String(data.get("status") ?? "").trim();
  const existingLease = data.get("existingLease") === "on";
  const start = String(data.get("leaseStartDate") ?? "");
  if (existingLease && (!unitId || !start || Number.isNaN(new Date(start).getTime()) || new Date(start) > new Date())) {
    return "Assign a unit and enter the original lease start date (not in the future) for an existing lease.";
  }
  try { parseOpeningArrears(data, { existingLease, unitId: unitId || null, leaseStartDate: new Date(start || Date.now()) }); }
  catch (error) { return error instanceof Error ? error.message : "Review previous arrears."; }

  if (!unitId) {
    return null;
  }

  for (const [field, label] of [["monthlyRent", "Agreed monthly rent"], ["deposit", "Agreed deposit"]]) {
    const value = String(data.get(field) ?? "").trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
      focusField(form, field);
      return `${label} is required and must be a non-negative amount with up to two decimal places.`;
    }
  }

  if (status !== "ACTIVE") {
    focusField(form, "status");
    return "A tenant must be Active if you want to assign a unit during creation.";
  }

  if (dueDayRaw) {
    const dueDay = Number.parseInt(dueDayRaw, 10);
    if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31) {
      focusField(form, "dueDay");
      return "Rent due day must be between 1 and 31.";
    }
  }

  return null;
}

export function validateStepFour(form: HTMLFormElement): string | null {
  const data = new FormData(form);
  const username = String(data.get("username") ?? "").trim().toLowerCase();
  const password = String(data.get("password") ?? "");
  const confirmPassword = String(data.get("confirmPassword") ?? "");

  if (!username) {
    focusField(form, "username");
    return "Username is required.";
  }

  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    focusField(form, "username");
    return "Username must be 3–30 characters and can only contain letters, numbers, dots, underscores, and hyphens.";
  }

  if (password.length < 8) {
    focusField(form, "password");
    return "Password must be at least 8 characters.";
  }

  if (password !== confirmPassword) {
    focusField(form, "confirmPassword");
    return "Password and confirmation do not match.";
  }

  return null;
}
