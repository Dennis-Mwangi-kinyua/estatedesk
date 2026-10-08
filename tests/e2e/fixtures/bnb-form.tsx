import React from "react";
import { createRoot } from "react-dom/client";
import { BnbForm } from "@/features/bnb/components/bnb-form";
const listing = { id: "bnb", title: "Kilimani sunny apartment", description: "A furnished apartment with a balcony, kitchen, and fast Wi-Fi for a comfortable stay.", location: "Kilimani, Nairobi", address: "", propertyType: "STUDIO" as const, bedrooms: 0, bathrooms: 2, beds: 3, maxGuests: 5, nightlyRate: 4500, cleaningFee: 750, minimumNights: 3, amenities: ["Wi-Fi" as const, "Kitchen" as const], houseRules: "No smoking indoors.", contactName: "Jane Host", contactPhone: "+254712345678", contactEmail: "host@example.com", status: "DRAFT" as const, images: [] };
createRoot(document.getElementById("fixture")!).render(<BnbForm listing={listing} contactName="Different logged-in name" currency="KES" />);
