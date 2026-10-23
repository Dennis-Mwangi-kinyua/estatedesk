export type LiveScope = { userId: string; activeOrgId: string | null; platformRole: string; provider?: boolean };

/** Signals contain only a scope identifier, never record data. */
export function matchesLiveScope(payload: string, session: LiveScope) {
  return payload === `user:${session.userId}` ||
    (payload === "marketplace" && session.provider === true) ||
    (!!session.activeOrgId && payload === `org:${session.activeOrgId}`) ||
    (payload === "platform" && ["PLATFORM_ADMIN", "SUPER_ADMIN"].includes(session.platformRole));
}
