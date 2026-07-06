import { buildUsernamePreview } from "./helpers";
import type { AvailableUnit, PreviewData } from "./types";

export function buildPreview(
  form: HTMLFormElement,
  selectedUnit: AvailableUnit | null,
): PreviewData {
  const data = new FormData(form);

  const fullName = String(data.get("fullName") ?? "").trim();
  const phone = String(data.get("phone") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const nationalId = String(data.get("nationalId") ?? "").trim();
  const kraPin = String(data.get("kraPin") ?? "").trim();
  const status = String(data.get("status") ?? "").trim();
  const notes = String(data.get("notes") ?? "").trim();

  const nextOfKinName = String(data.get("nextOfKinName") ?? "").trim();
  const nextOfKinRelationship = String(
    data.get("nextOfKinRelationship") ?? "",
  ).trim();
  const nextOfKinPhone = String(data.get("nextOfKinPhone") ?? "").trim();
  const nextOfKinEmail = String(data.get("nextOfKinEmail") ?? "").trim();

  const leaseStartDate = String(data.get("leaseStartDate") ?? "").trim();
  const dueDay = String(data.get("dueDay") ?? "").trim();
  const monthlyRent = String(data.get("monthlyRent") ?? "").trim();
  const deposit = String(data.get("deposit") ?? "").trim();
  const username = String(data.get("username") ?? "").trim().toLowerCase();
  const password = String(data.get("password") ?? "");

  return {
    fullName,
    phone,
    email,
    nationalId,
    kraPin,
    status,
    notes,
    nextOfKinName,
    nextOfKinRelationship,
    nextOfKinPhone,
    nextOfKinEmail,
    selectedUnitLabel: selectedUnit ? selectedUnit.label : "No unit assignment yet",
    leaseStartDate: leaseStartDate || "Use today’s date",
    dueDay: dueDay || "5",
    monthlyRent: monthlyRent || "Use selected unit rent",
    deposit: deposit || "Use selected unit deposit",
    username: username || buildUsernamePreview(fullName),
    password,
  };
}