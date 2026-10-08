/** A tenant ID is a recipient, never metadata about a staff member's tenant. */
export function personalNotificationScope(input: { userId: string; tenantId?: string | null }) {
  if (!input.tenantId) return { userId: input.userId, tenantId: null };
  return {
    OR: [
      { userId: input.userId, tenantId: null },
      { userId: input.userId, tenantId: input.tenantId },
      { userId: null, tenantId: input.tenantId },
    ],
  };
}
