import { focusField } from "./helpers";

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

  if (!unitId) {
    return null;
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