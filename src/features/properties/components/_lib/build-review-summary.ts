import {
  formatCurrency,
  formatPropertyType,
  formatUnitTypeLabel,
} from "./helpers";
import type { ReviewSummary } from "./types";

export function buildReviewSummary(
  form: HTMLFormElement,
  taxpayerProfileMap: Map<string, string>,
  landlordProfileMap: Map<string, string>,
  currencyCode: string,
): ReviewSummary {
  const data = new FormData(form);

  const name = String(data.get("name") ?? "").trim();
  const type = String(data.get("type") ?? "").trim();
  const taxpayerProfileId = String(data.get("taxpayerProfileId") ?? "").trim();
  const landlordModeValue = String(data.get("landlordMode") ?? "none");
  const existingLandlordProfileId = String(
    data.get("existingLandlordProfileId") ?? "",
  ).trim();
  const landlordFullName = String(data.get("landlordFullName") ?? "").trim();
  const landlordUsername = String(data.get("landlordUsername") ?? "").trim();
  const location = String(data.get("location") ?? "").trim();
  const address = String(data.get("address") ?? "").trim();
  const notes = String(data.get("notes") ?? "").trim();
  const waterRatePerUnit = String(data.get("waterRatePerUnit") ?? "").trim();
  const waterFixedCharge = String(data.get("waterFixedCharge") ?? "").trim();
  const isActive = data.get("isActive") === "on";

  const unitTypes = data
    .getAll("unitPlanUnitType[]")
    .map((value) => String(value).trim());

  const bedrooms = data
    .getAll("unitPlanBedrooms[]")
    .map((value) => String(value).trim());

  const quantities = data
    .getAll("unitPlanQuantity[]")
    .map((value) => String(value).trim());

  const labels: string[] = [];
  let totalGeneratedUnits = 0;

  for (let index = 0; index < unitTypes.length; index += 1) {
    const unitType = unitTypes[index] ?? "";
    const bedroomValue = bedrooms[index] ?? "";
    const quantityValue = quantities[index] ?? "";

    if (!unitType) continue;

    const quantity = Number.parseInt(quantityValue || "0", 10);
    totalGeneratedUnits += Number.isFinite(quantity) ? quantity : 0;

    labels.push(
      `${formatUnitTypeLabel(unitType, bedroomValue)}${
        quantity > 0 ? ` x ${quantity}` : ""
      }`,
    );
  }

  return {
    name: name || "—",
    type: type ? formatPropertyType(type) : "—",
    taxpayerProfile: taxpayerProfileId
      ? taxpayerProfileMap.get(taxpayerProfileId) ?? "Selected profile"
      : "No linked taxpayer profile",
    landlord:
      landlordModeValue === "existing" && existingLandlordProfileId
        ? landlordProfileMap.get(existingLandlordProfileId) ?? "Selected landlord"
        : landlordModeValue === "new"
          ? `${landlordFullName || "New landlord"} (${landlordUsername || "no username"})`
          : "No landlord linked",
    location: location || "—",
    address: address || "—",
    notes: notes || "No notes added",
    waterRatePerUnit: formatCurrency(waterRatePerUnit, currencyCode),
    waterFixedCharge: formatCurrency(waterFixedCharge, currencyCode),
    isActive,
    unitMixCount: labels.length,
    totalGeneratedUnits,
    unitMixLabels: labels,
  };
}