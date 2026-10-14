"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgRole } from "@/lib/permissions/guards";
import { reinstateTenant, reinstateSchema } from "./service";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";
import { safeClientMessage } from "@/lib/errors/client-safe-error";
import type { ProviderActionState } from "@/features/providers/actions";
export async function reinstateTenantAction(_state: ProviderActionState, form: FormData): Promise<ProviderActionState> {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
  try { const data = reinstateSchema.parse(Object.fromEntries(form)); await reinstateTenant(session.activeOrgId!, session.userId, data); revalidatePath("/dashboard/org/tenants", "layout"); revalidatePath("/dashboard/tenant", "layout"); revalidatePath("/dashboard/org/units"); revalidatePublicVacancies(); return { message: "Tenant reinstated. The new lease and initial charges are ready; earlier history is preserved." }; } catch (error) { return { error: error instanceof z.ZodError ? error.issues[0]?.message : safeClientMessage(error, "Unable to reinstate this tenant. Please try again.") }; }
}
