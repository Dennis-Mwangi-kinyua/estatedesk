export function leaseTenantReadiness(user: { status: string; lastLoginAt: Date | null } | null) {
  if (!user) return "Finish onboarding and link the tenant’s account before sending the agreement.";
  if (user.status !== "ACTIVE") return "The tenant’s account must be active before sending the agreement.";
  if (!user.lastLoginAt) return "Waiting for the tenant’s first login. Ask them to sign in using their onboarding details.";
  return null;
}

/** Every tenant signs before the organization countersigns; other parties follow. */
export function leaseSigningSteps(additionalRoles: readonly string[]) {
  const organization = 2 + additionalRoles.filter(role => role === "TENANT").length;
  let tenantOrder = 1;
  let otherOrder = organization;
  return { tenant: 1, organization, additional: additionalRoles.map(role => role === "TENANT" ? ++tenantOrder : ++otherOrder) };
}

export function signerCanSign(signer: { signingOrder: number; status: string }, signers: ReadonlyArray<{ signingOrder: number; status: string }>) {
  return signer.status === "PENDING" && signers.every(party => party.signingOrder >= signer.signingOrder || party.status === "SIGNED");
}
