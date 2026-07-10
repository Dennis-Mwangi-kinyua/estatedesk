import { z } from "zod";

/** Public vacant-houses API item (shape used by integrations). */
export const publicVacantUnitSchema = z.object({
  id: z.string(),
  unitCode: z.string().optional(),
  unitType: z.string().optional(),
  rentAmount: z.union([z.number(), z.string()]).optional(),
  currency: z.string().optional(),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  propertyName: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  publicSlug: z.string().optional(),
  listingUrl: z.string().optional(),
});

export const publicVacantHousesResponseSchema = z.object({
  data: z.array(publicVacantUnitSchema),
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
