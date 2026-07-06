export function validateWizardStep(
  currentStep: number,
  form: HTMLFormElement,
): string | null {
  const data = new FormData(form);

  if (currentStep === 1) {
    const name = String(data.get("name") ?? "").trim();
    const type = String(data.get("type") ?? "").trim();

    if (!name) {
      return "Property name is required before continuing.";
    }

    if (!type) {
      return "Property type is required before continuing.";
    }
  }

  if (currentStep === 2) {
    const mode = String(data.get("landlordMode") ?? "none");

    if (mode === "existing") {
      const existingLandlordProfileId = String(
        data.get("existingLandlordProfileId") ?? "",
      ).trim();

      if (!existingLandlordProfileId) {
        return "Choose an existing landlord before continuing.";
      }
    }

    if (mode === "new") {
      const fullName = String(data.get("landlordFullName") ?? "").trim();
      const username = String(data.get("landlordUsername") ?? "").trim();
      const password = String(data.get("landlordPassword") ?? "").trim();

      if (!fullName) {
        return "Landlord full name is required.";
      }

      if (username.length < 3) {
        return "Landlord username must be at least 3 characters.";
      }

      if (password.length < 8) {
        return "Landlord password must be at least 8 characters.";
      }
    }
  }

  if (currentStep === 3) {
    const waterRate = String(data.get("waterRatePerUnit") ?? "").trim();
    const waterFixed = String(data.get("waterFixedCharge") ?? "").trim();

    if (waterRate && Number.isNaN(Number(waterRate))) {
      return "Water rate per unit must be a valid number.";
    }

    if (waterFixed && Number.isNaN(Number(waterFixed))) {
      return "Water fixed charge must be a valid number.";
    }
  }

  if (currentStep === 4) {
    const unitTypes = data
      .getAll("unitPlanUnitType[]")
      .map((value) => String(value).trim());
    const quantities = data
      .getAll("unitPlanQuantity[]")
      .map((value) => String(value).trim());
    const defaultRents = data
      .getAll("unitPlanDefaultRentAmount[]")
      .map((value) => String(value).trim());
    const bedrooms = data
      .getAll("unitPlanBedrooms[]")
      .map((value) => String(value).trim());

    for (let index = 0; index < unitTypes.length; index += 1) {
      const unitType = unitTypes[index] ?? "";
      if (!unitType) continue;

      const quantity = Number.parseInt(quantities[index] ?? "", 10);
      const rent = defaultRents[index] ?? "";

      if (!Number.isFinite(quantity) || quantity < 1) {
        return `Unit mix row ${index + 1} needs a quantity of at least 1.`;
      }

      if (!rent || Number.isNaN(Number(rent)) || Number(rent) < 0) {
        return `Unit mix row ${index + 1} needs a valid default rent amount.`;
      }

      if (unitType === "APARTMENT") {
        const bedroomValue = Number.parseInt(bedrooms[index] ?? "", 10);
        if (![1, 2, 3, 4].includes(bedroomValue)) {
          return `Apartment row ${index + 1} needs bedrooms set to 1, 2, 3, or 4.`;
        }
      }
    }
  }

  return null;
}