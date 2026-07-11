import { z } from "zod";

/** Public vacant-houses API item (shape used by integrations). */
export const publicVacantUnitSchema = z.object({
  id: z.string(),
  houseNumber: z.string().optional(),
  unitCode: z.string().optional(),
  unitType: z.string().optional(),
  type: z.string().optional(),
  rentAmount: z.union([z.number(), z.string()]).optional(),
  price: z.union([z.number(), z.string()]).optional(),
  depositAmount: z.union([z.number(), z.string()]).nullable().optional(),
  currency: z.string().optional(),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  roomCount: z.number().nullable().optional(),
  propertyName: z.string().optional(),
  property: z.string().optional(),
  location: z.string().optional(),
  city: z.string().nullable().optional(),
  building: z.string().nullable().optional(),
  publicSlug: z.string().optional(),
  listingUrl: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string(),
        key: z.string().optional(),
        fileName: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

export const publicVacantHousesResponseSchema = z.object({
  count: z.number().optional(),
  houses: z.array(publicVacantUnitSchema).optional(),
  data: z.array(publicVacantUnitSchema).optional(),
  meta: z
    .object({
      count: z.number().optional(),
      generatedAt: z.string().optional(),
    })
    .optional(),
});

export type PublicVacantUnit = z.infer<typeof publicVacantUnitSchema>;
export type PublicVacantHousesResponse = z.infer<
  typeof publicVacantHousesResponseSchema
>;
