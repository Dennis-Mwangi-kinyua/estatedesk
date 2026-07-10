export const SECURITY_GATE_PREFIXES = ["/change-password"] as const;

export function isSecurityGatePathname(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "");

  return SECURITY_GATE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}